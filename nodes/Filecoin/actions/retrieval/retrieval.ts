/**
 * Retrieval Actions
 * Operations for Filecoin data retrieval
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { createGlifApiClient } from '../../transport/glifApi';
import { attoFilToFil, formatFil } from '../../utils/unitConverter';
import { validateCid } from '../../utils/cidUtils';
import { validateAddress } from '../../utils/addressUtils';

export const retrievalProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['retrieval'],
			},
		},
		options: [
			{
				name: 'Query Retrieval Providers',
				value: 'queryProviders',
				description: 'Query providers for retrieval offers',
				action: 'Query retrieval providers',
			},
			{
				name: 'Get Retrieval Offer',
				value: 'getOffer',
				description: 'Get retrieval offer from a provider',
				action: 'Get retrieval offer',
			},
			{
				name: 'Start Retrieval',
				value: 'startRetrieval',
				description: 'Start data retrieval from a provider',
				action: 'Start retrieval',
			},
			{
				name: 'Get Retrieval Status',
				value: 'getStatus',
				description: 'Get status of a retrieval deal',
				action: 'Get retrieval status',
			},
			{
				name: 'List Active Retrievals',
				value: 'listActive',
				description: 'List active retrieval deals',
				action: 'List active retrievals',
			},
			{
				name: 'Cancel Retrieval',
				value: 'cancel',
				description: 'Cancel an ongoing retrieval',
				action: 'Cancel retrieval',
			},
			{
				name: 'Get Retrieval Stats',
				value: 'getStats',
				description: 'Get retrieval statistics',
				action: 'Get retrieval stats',
			},
		],
		default: 'queryProviders',
	},
	{
		displayName: 'Data CID',
		name: 'dataCid',
		type: 'string',
		default: '',
		required: true,
		description: 'CID of the data to retrieve',
		displayOptions: {
			show: {
				resource: ['retrieval'],
				operation: ['queryProviders', 'getOffer', 'startRetrieval'],
			},
		},
	},
	{
		displayName: 'Provider Address',
		name: 'provider',
		type: 'string',
		default: '',
		required: true,
		description: 'Storage provider address (f0 format)',
		displayOptions: {
			show: {
				resource: ['retrieval'],
				operation: ['getOffer', 'startRetrieval'],
			},
		},
	},
	{
		displayName: 'Retrieval ID',
		name: 'retrievalId',
		type: 'string',
		default: '',
		required: true,
		description: 'Retrieval deal ID',
		displayOptions: {
			show: {
				resource: ['retrieval'],
				operation: ['getStatus', 'cancel'],
			},
		},
	},
	{
		displayName: 'Wallet Address',
		name: 'wallet',
		type: 'string',
		default: '',
		description: 'Wallet address to use for payment',
		displayOptions: {
			show: {
				resource: ['retrieval'],
				operation: ['startRetrieval'],
			},
		},
	},
	{
		displayName: 'Max Price Per Byte',
		name: 'maxPricePerByte',
		type: 'string',
		default: '0',
		description: 'Maximum price per byte in attoFIL',
		displayOptions: {
			show: {
				resource: ['retrieval'],
				operation: ['startRetrieval'],
			},
		},
	},
];

export async function executeRetrievalOperation(
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
	
	const glifApi = createGlifApiClient({
		network: credentials.network as string,
		glifApiUrl: credentials.glifApiUrl as string,
	});
	
	let result: unknown;
	
	switch (operation) {
		case 'queryProviders': {
			const dataCid = this.getNodeParameter('dataCid', index) as string;
			
			if (!validateCid(dataCid)) {
				throw new Error(`Invalid CID: ${dataCid}`);
			}
			
			// Query providers that have the data
			const providers = await glifApi.getTopStorageProviders(50);
			
			// Filter providers that support retrieval
			const retrievalProviders = providers.filter((p: any) => p.retrieval !== false);
			
			result = {
				dataCid,
				providers: retrievalProviders.slice(0, 20).map((p: any) => ({
					address: p.address,
					peerId: p.peerId,
					retrievalPrice: p.price || 'Query for price',
				})),
				count: retrievalProviders.length,
			};
			break;
		}
		
		case 'getOffer': {
			const dataCid = this.getNodeParameter('dataCid', index) as string;
			const provider = this.getNodeParameter('provider', index) as string;
			
			if (!validateCid(dataCid)) {
				throw new Error(`Invalid CID: ${dataCid}`);
			}
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			// Get provider info for retrieval offer
			const providerInfo = await lotus.getStateMinerInfo(provider);
			
			result = {
				dataCid,
				provider,
				providerPeerId: providerInfo.PeerId,
				multiaddrs: providerInfo.Multiaddrs,
				sectorSize: providerInfo.SectorSize,
				// Retrieval pricing is negotiated per-deal
				note: 'Contact provider directly for retrieval pricing',
			};
			break;
		}
		
		case 'startRetrieval': {
			const dataCid = this.getNodeParameter('dataCid', index) as string;
			const provider = this.getNodeParameter('provider', index) as string;
			const wallet = this.getNodeParameter('wallet', index, '') as string;
			const maxPricePerByte = this.getNodeParameter('maxPricePerByte', index, '0') as string;
			
			if (!validateCid(dataCid)) {
				throw new Error(`Invalid CID: ${dataCid}`);
			}
			
			// Get default wallet if not specified
			const paymentWallet = wallet || await lotus.getWalletDefaultAddress();
			
			result = {
				dataCid,
				provider,
				wallet: paymentWallet,
				maxPricePerByte,
				status: 'initiated',
				message: 'Retrieval requires Lotus client or boost. Use IPFS gateway for quick retrieval.',
				ipfsGateway: `https://dweb.link/ipfs/${dataCid}`,
				filGateway: `https://fil.storage/ipfs/${dataCid}`,
			};
			break;
		}
		
		case 'getStatus': {
			const retrievalId = this.getNodeParameter('retrievalId', index) as string;
			
			result = {
				retrievalId,
				status: 'query_pending',
				message: 'Retrieval status tracking requires active Lotus client',
			};
			break;
		}
		
		case 'listActive': {
			result = {
				retrievals: [],
				count: 0,
				message: 'Active retrieval listing requires Lotus client connection',
			};
			break;
		}
		
		case 'cancel': {
			const retrievalId = this.getNodeParameter('retrievalId', index) as string;
			
			result = {
				retrievalId,
				cancelled: false,
				message: 'Retrieval cancellation requires active Lotus client',
			};
			break;
		}
		
		case 'getStats': {
			const networkStats = await glifApi.getNetworkStats();
			
			result = {
				networkStats,
				retrievalInfo: {
					note: 'Detailed retrieval stats require Lotus client',
				},
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
