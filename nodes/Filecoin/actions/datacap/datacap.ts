/**
 * DataCap Actions
 * Operations for Filecoin Plus (Fil+) DataCap
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { validateAddress } from '../../utils/addressUtils';

export const datacapProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['datacap'] } },
		options: [
			{ name: 'Get DataCap Balance', value: 'getDatacapBalance', description: 'Get DataCap balance for a client', action: 'Get datacap balance' },
			{ name: 'Get Verified Client Status', value: 'getVerifiedClientStatus', description: 'Get verified client status', action: 'Get verified client status' },
			{ name: 'List Verified Clients', value: 'listVerifiedClients', description: 'List verified clients', action: 'List verified clients' },
			{ name: 'Get Verifier Status', value: 'getVerifierStatus', description: 'Get notary/verifier status', action: 'Get verifier status' },
			{ name: 'Get Registry Root Key', value: 'getRegistryRootKey', description: 'Get verified registry root key', action: 'Get registry root key' },
		],
		default: 'getDatacapBalance',
	},
	{
		displayName: 'Client Address',
		name: 'clientAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Client address to query',
		displayOptions: { show: { resource: ['datacap'], operation: ['getDatacapBalance', 'getVerifiedClientStatus'] } },
	},
	{
		displayName: 'Verifier Address',
		name: 'verifierAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Verifier/notary address',
		displayOptions: { show: { resource: ['datacap'], operation: ['getVerifierStatus'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 100,
		description: 'Maximum results to return',
		displayOptions: { show: { resource: ['datacap'], operation: ['listVerifiedClients'] } },
	},
];

export async function executeDatacapOperation(
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
		case 'getDatacapBalance': {
			const client = this.getNodeParameter('clientAddress', index) as string;
			if (!validateAddress(client)) throw new Error(`Invalid client address: ${client}`);
			
			const datacap = await lotus.stateVerifiedClientStatus(client);
			const datacapBytes = BigInt(datacap || '0');
			
			result = {
				client,
				datacapBytes: datacap || '0',
				datacapGiB: (Number(datacapBytes) / (1024 ** 3)).toFixed(2),
				datacapTiB: (Number(datacapBytes) / (1024 ** 4)).toFixed(2),
				datacapPiB: (Number(datacapBytes) / (1024 ** 5)).toFixed(4),
				isVerified: datacapBytes > 0,
			};
			break;
		}
		
		case 'getVerifiedClientStatus': {
			const client = this.getNodeParameter('clientAddress', index) as string;
			if (!validateAddress(client)) throw new Error(`Invalid client address: ${client}`);
			
			const datacap = await lotus.stateVerifiedClientStatus(client);
			
			result = {
				client,
				isVerified: datacap !== null && BigInt(datacap) > 0,
				datacap: datacap || '0',
				datacapTiB: datacap ? (Number(BigInt(datacap)) / (1024 ** 4)).toFixed(2) : '0',
			};
			break;
		}
		
		case 'listVerifiedClients': {
			const limit = this.getNodeParameter('limit', index) as number;
			const clients = await lotus.stateListVerifiedClients();
			
			const clientList = (clients || []).slice(0, limit).map((c: { Address: string; DataCap: string }) => ({
				address: c.Address,
				datacap: c.DataCap,
				datacapTiB: (Number(BigInt(c.DataCap)) / (1024 ** 4)).toFixed(2),
			}));
			
			result = {
				clients: clientList,
				count: clientList.length,
				total: (clients || []).length,
			};
			break;
		}
		
		case 'getVerifierStatus': {
			const verifier = this.getNodeParameter('verifierAddress', index) as string;
			if (!validateAddress(verifier)) throw new Error(`Invalid verifier address: ${verifier}`);
			
			const allowance = await lotus.stateVerifierStatus(verifier);
			
			result = {
				verifier,
				isVerifier: allowance !== null && BigInt(allowance) > 0,
				allowance: allowance || '0',
				allowanceTiB: allowance ? (Number(BigInt(allowance)) / (1024 ** 4)).toFixed(2) : '0',
			};
			break;
		}
		
		case 'getRegistryRootKey': {
			const rootKey = await lotus.stateVerifiedRegistryRootKey();
			
			result = {
				rootKey,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
