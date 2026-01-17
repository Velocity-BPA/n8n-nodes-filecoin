/**
 * Market Actions
 * Operations for Filecoin storage market
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { formatFil } from '../../utils/unitConverter';
import { validateAddress } from '../../utils/addressUtils';

export const marketProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['market'] } },
		options: [
			{ name: 'Get Market Balance', value: 'getMarketBalance', description: 'Get market balance for address', action: 'Get market balance' },
			{ name: 'Get All Market Deals', value: 'getAllMarketDeals', description: 'Get all market deals', action: 'Get all market deals' },
			{ name: 'Get Deal by ID', value: 'getDealById', description: 'Get specific deal by ID', action: 'Get deal by ID' },
		],
		default: 'getMarketBalance',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Address to query market balance',
		displayOptions: { show: { resource: ['market'], operation: ['getMarketBalance'] } },
	},
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'number',
		default: 0,
		required: true,
		description: 'Deal ID',
		displayOptions: { show: { resource: ['market'], operation: ['getDealById'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 100,
		description: 'Maximum deals to return',
		displayOptions: { show: { resource: ['market'], operation: ['getAllMarketDeals'] } },
	},
];

export async function executeMarketOperation(
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
		case 'getMarketBalance': {
			const address = this.getNodeParameter('address', index) as string;
			if (!validateAddress(address)) throw new Error(`Invalid address: ${address}`);
			
			const balance = await lotus.stateMarketBalance(address);
			
			result = {
				address,
				escrow: balance.Escrow,
				escrowFormatted: formatFil(balance.Escrow) + ' FIL',
				locked: balance.Locked,
				lockedFormatted: formatFil(balance.Locked) + ' FIL',
				available: (BigInt(balance.Escrow) - BigInt(balance.Locked)).toString(),
				availableFormatted: formatFil((BigInt(balance.Escrow) - BigInt(balance.Locked)).toString()) + ' FIL',
			};
			break;
		}
		
		case 'getAllMarketDeals': {
			const limit = this.getNodeParameter('limit', index) as number;
			const deals = await lotus.stateMarketDeals();
			
			const dealList = Object.entries(deals).slice(0, limit).map(([id, deal]: [string, unknown]) => {
				const d = deal as {
					Proposal: {
						PieceCID: { '/': string };
						PieceSize: number;
						VerifiedDeal: boolean;
						Client: string;
						Provider: string;
						StartEpoch: number;
						EndEpoch: number;
						StoragePricePerEpoch: string;
					};
					State: { SectorStartEpoch: number; SlashEpoch: number };
				};
				return {
					dealId: parseInt(id),
					pieceCid: d.Proposal.PieceCID['/'],
					pieceSize: d.Proposal.PieceSize,
					verified: d.Proposal.VerifiedDeal,
					client: d.Proposal.Client,
					provider: d.Proposal.Provider,
					startEpoch: d.Proposal.StartEpoch,
					endEpoch: d.Proposal.EndEpoch,
					pricePerEpoch: d.Proposal.StoragePricePerEpoch,
					active: d.State.SectorStartEpoch > 0,
					slashed: d.State.SlashEpoch > 0,
				};
			});
			
			result = {
				deals: dealList,
				count: dealList.length,
				totalDeals: Object.keys(deals).length,
			};
			break;
		}
		
		case 'getDealById': {
			const dealId = this.getNodeParameter('dealId', index) as number;
			const deal = await lotus.stateMarketStorageDeal(dealId);
			
			const durationEpochs = deal.Proposal.EndEpoch - deal.Proposal.StartEpoch;
			const totalCost = BigInt(deal.Proposal.StoragePricePerEpoch) * BigInt(durationEpochs);
			
			result = {
				dealId,
				proposal: {
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
					totalCost: totalCost.toString(),
					totalCostFormatted: formatFil(totalCost.toString()) + ' FIL',
					providerCollateral: deal.Proposal.ProviderCollateral,
					clientCollateral: deal.Proposal.ClientCollateral,
				},
				state: {
					sectorStartEpoch: deal.State.SectorStartEpoch,
					lastUpdatedEpoch: deal.State.LastUpdatedEpoch,
					slashEpoch: deal.State.SlashEpoch,
					isActive: deal.State.SectorStartEpoch > 0 && deal.State.SlashEpoch === -1,
					isSlashed: deal.State.SlashEpoch > 0,
				},
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
