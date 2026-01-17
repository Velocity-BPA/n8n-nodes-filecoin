/**
 * Storage Deal Actions
 * Operations for Filecoin storage deals
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { attoFilToFil, formatFil } from '../../utils/unitConverter';
import { validateAddress } from '../../utils/addressUtils';

export const storageDealProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['storageDeal'] } },
		options: [
			{ name: 'Get Deal Info', value: 'getDealInfo', description: 'Get storage deal information', action: 'Get deal info' },
			{ name: 'Get Deal Status', value: 'getDealStatus', description: 'Get deal status', action: 'Get deal status' },
			{ name: 'List Market Deals', value: 'listMarketDeals', description: 'List deals from market actor', action: 'List market deals' },
			{ name: 'Query Ask', value: 'queryAsk', description: 'Query storage provider ask price', action: 'Query ask' },
			{ name: 'Get Client Deals', value: 'getClientDeals', description: 'Get deals for a client', action: 'Get client deals' },
			{ name: 'Get Provider Deals', value: 'getProviderDeals', description: 'Get deals for a provider', action: 'Get provider deals' },
			{ name: 'Get Deal Proposal', value: 'getDealProposal', description: 'Get deal proposal details', action: 'Get deal proposal' },
		],
		default: 'getDealInfo',
	},
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'number',
		default: 0,
		required: true,
		description: 'Storage deal ID',
		displayOptions: { show: { resource: ['storageDeal'], operation: ['getDealInfo', 'getDealStatus', 'getDealProposal'] } },
	},
	{
		displayName: 'Provider Address',
		name: 'providerAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Storage provider address (f0 or t0)',
		displayOptions: { show: { resource: ['storageDeal'], operation: ['queryAsk', 'getProviderDeals'] } },
	},
	{
		displayName: 'Client Address',
		name: 'clientAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Client address',
		displayOptions: { show: { resource: ['storageDeal'], operation: ['getClientDeals'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 100,
		description: 'Maximum number of deals to return',
		displayOptions: { show: { resource: ['storageDeal'], operation: ['listMarketDeals', 'getClientDeals', 'getProviderDeals'] } },
	},
];

export async function executeStorageDealOperation(
	this: IExecuteFunctions,
	index: number
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('filecoinNetwork');
	
	const lotus = createLotusClient({
		network: credentials.network as string,
		lotusRpcUrl: credentials.lotusRpcUrl as string,
		lotusApiToken: credentials.lotusApiToken as string,
	});
	
	let result: unknown;
	
	switch (operation) {
		case 'getDealInfo': {
			const dealId = this.getNodeParameter('dealId', index) as number;
			const deal = await lotus.stateMarketStorageDeal(dealId);
			
			result = {
				dealId,
				proposal: {
					pieceCid: deal.Proposal.PieceCID['/'],
					pieceSize: deal.Proposal.PieceSize,
					verifiedDeal: deal.Proposal.VerifiedDeal,
					client: deal.Proposal.Client,
					provider: deal.Proposal.Provider,
					startEpoch: deal.Proposal.StartEpoch,
					endEpoch: deal.Proposal.EndEpoch,
					storagePricePerEpoch: deal.Proposal.StoragePricePerEpoch,
					providerCollateral: deal.Proposal.ProviderCollateral,
					clientCollateral: deal.Proposal.ClientCollateral,
				},
				state: {
					sectorStartEpoch: deal.State.SectorStartEpoch,
					lastUpdatedEpoch: deal.State.LastUpdatedEpoch,
					slashEpoch: deal.State.SlashEpoch,
				},
			};
			break;
		}
		
		case 'getDealStatus': {
			const dealId = this.getNodeParameter('dealId', index) as number;
			const deal = await lotus.stateMarketStorageDeal(dealId);
			const head = await lotus.getChainHead();
			const currentEpoch = head.Height;
			
			// Determine deal state
			let stateLabel: string;
			if (deal.State.SlashEpoch > 0) {
				stateLabel = 'Slashed';
			} else if (currentEpoch >= deal.Proposal.EndEpoch) {
				stateLabel = 'Expired';
			} else if (deal.State.SectorStartEpoch > 0) {
				stateLabel = 'Active';
			} else if (currentEpoch >= deal.Proposal.StartEpoch) {
				stateLabel = 'Pending Activation';
			} else {
				stateLabel = 'Proposed';
			}
			
			result = {
				dealId,
				status: stateLabel,
				currentEpoch,
				startEpoch: deal.Proposal.StartEpoch,
				endEpoch: deal.Proposal.EndEpoch,
				isActive: deal.State.SectorStartEpoch > 0 && deal.State.SlashEpoch === -1,
				isSlashed: deal.State.SlashEpoch > 0,
				epochsRemaining: deal.Proposal.EndEpoch - currentEpoch,
			};
			break;
		}
		
		case 'listMarketDeals': {
			const limit = this.getNodeParameter('limit', index) as number;
			const deals = await lotus.stateMarketDeals();
			
			const dealList = Object.entries(deals).slice(0, limit).map(([id, deal]: [string, unknown]) => {
				const d = deal as { Proposal: { Client: string; Provider: string; PieceCID: { '/': string }; PieceSize: number; VerifiedDeal: boolean }; State: { SectorStartEpoch: number } };
				return {
					dealId: parseInt(id),
					client: d.Proposal.Client,
					provider: d.Proposal.Provider,
					pieceCid: d.Proposal.PieceCID['/'],
					pieceSize: d.Proposal.PieceSize,
					verified: d.Proposal.VerifiedDeal,
					active: d.State.SectorStartEpoch > 0,
				};
			});
			
			result = {
				deals: dealList,
				count: dealList.length,
				total: Object.keys(deals).length,
			};
			break;
		}
		
		case 'queryAsk': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			const minerInfo = await lotus.stateMinerInfo(provider);
			const ask = await lotus.clientQueryAsk(minerInfo.PeerId, provider) as {
				Ask: {
					Price: string;
					VerifiedPrice: string;
					MinPieceSize: number;
					MaxPieceSize: number;
					Expiry: number;
				};
			};
			
			result = {
				provider,
				price: ask.Ask.Price,
				priceFormatted: formatFil(ask.Ask.Price) + ' FIL/GiB/epoch',
				verifiedPrice: ask.Ask.VerifiedPrice,
				verifiedPriceFormatted: formatFil(ask.Ask.VerifiedPrice) + ' FIL/GiB/epoch',
				minPieceSize: ask.Ask.MinPieceSize,
				maxPieceSize: ask.Ask.MaxPieceSize,
				expiry: ask.Ask.Expiry,
			};
			break;
		}
		
		case 'getClientDeals': {
			const client = this.getNodeParameter('clientAddress', index) as string;
			const limit = this.getNodeParameter('limit', index) as number;
			
			if (!validateAddress(client)) throw new Error(`Invalid client address: ${client}`);
			
			const deals = await lotus.stateMarketDeals();
			const clientDeals = Object.entries(deals)
				.filter(([, deal]: [string, unknown]) => {
					const d = deal as { Proposal: { Client: string } };
					return d.Proposal.Client === client;
				})
				.slice(0, limit)
				.map(([id, deal]: [string, unknown]) => {
					const d = deal as { Proposal: { Provider: string; PieceCID: { '/': string }; PieceSize: number; StartEpoch: number; EndEpoch: number }; State: { SectorStartEpoch: number } };
					return {
						dealId: parseInt(id),
						provider: d.Proposal.Provider,
						pieceCid: d.Proposal.PieceCID['/'],
						pieceSize: d.Proposal.PieceSize,
						startEpoch: d.Proposal.StartEpoch,
						endEpoch: d.Proposal.EndEpoch,
						active: d.State.SectorStartEpoch > 0,
					};
				});
			
			result = {
				client,
				deals: clientDeals,
				count: clientDeals.length,
			};
			break;
		}
		
		case 'getProviderDeals': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			const limit = this.getNodeParameter('limit', index) as number;
			
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			const deals = await lotus.stateMarketDeals();
			const providerDeals = Object.entries(deals)
				.filter(([, deal]: [string, unknown]) => {
					const d = deal as { Proposal: { Provider: string } };
					return d.Proposal.Provider === provider;
				})
				.slice(0, limit)
				.map(([id, deal]: [string, unknown]) => {
					const d = deal as { Proposal: { Client: string; PieceCID: { '/': string }; PieceSize: number; VerifiedDeal: boolean }; State: { SectorStartEpoch: number } };
					return {
						dealId: parseInt(id),
						client: d.Proposal.Client,
						pieceCid: d.Proposal.PieceCID['/'],
						pieceSize: d.Proposal.PieceSize,
						verified: d.Proposal.VerifiedDeal,
						active: d.State.SectorStartEpoch > 0,
					};
				});
			
			result = {
				provider,
				deals: providerDeals,
				count: providerDeals.length,
			};
			break;
		}
		
		case 'getDealProposal': {
			const dealId = this.getNodeParameter('dealId', index) as number;
			const deal = await lotus.stateMarketStorageDeal(dealId);
			
			const durationEpochs = deal.Proposal.EndEpoch - deal.Proposal.StartEpoch;
			const totalCost = BigInt(deal.Proposal.StoragePricePerEpoch) * BigInt(durationEpochs);
			
			result = {
				dealId,
				pieceCid: deal.Proposal.PieceCID['/'],
				pieceSize: deal.Proposal.PieceSize,
				verifiedDeal: deal.Proposal.VerifiedDeal,
				client: deal.Proposal.Client,
				provider: deal.Proposal.Provider,
				label: deal.Proposal.Label,
				startEpoch: deal.Proposal.StartEpoch,
				endEpoch: deal.Proposal.EndEpoch,
				durationEpochs,
				storagePricePerEpoch: deal.Proposal.StoragePricePerEpoch,
				totalStorageCost: totalCost.toString(),
				totalStorageCostFormatted: formatFil(totalCost.toString()) + ' FIL',
				providerCollateral: deal.Proposal.ProviderCollateral,
				clientCollateral: deal.Proposal.ClientCollateral,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
