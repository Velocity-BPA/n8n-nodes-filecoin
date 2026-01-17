/**
 * State Actions
 * Operations for Filecoin state queries
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { validateAddress } from '../../utils/addressUtils';

export const stateProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['state'] } },
		options: [
			{ name: 'Get Actor', value: 'getActor', description: 'Get actor state', action: 'Get actor' },
			{ name: 'Get Account Key', value: 'getAccountKey', description: 'Get account key for ID address', action: 'Get account key' },
			{ name: 'Lookup ID', value: 'lookupId', description: 'Get ID address for robust address', action: 'Lookup ID' },
			{ name: 'List Actors', value: 'listActors', description: 'List all actors', action: 'List actors' },
			{ name: 'Read State', value: 'readState', description: 'Read actor state', action: 'Read state' },
		],
		default: 'getActor',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Actor/account address',
		displayOptions: { show: { resource: ['state'], operation: ['getActor', 'getAccountKey', 'lookupId', 'readState'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 100,
		description: 'Maximum results to return',
		displayOptions: { show: { resource: ['state'], operation: ['listActors'] } },
	},
];

export async function executeStateOperation(
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
		case 'getActor': {
			const address = this.getNodeParameter('address', index) as string;
			if (!validateAddress(address)) throw new Error(`Invalid address: ${address}`);
			
			const actor = await lotus.getStateGetActor(address);
			
			result = {
				address,
				code: actor.Code['/'],
				head: actor.Head['/'],
				nonce: actor.Nonce,
				balance: actor.Balance,
			};
			break;
		}
		
		case 'getAccountKey': {
			const address = this.getNodeParameter('address', index) as string;
			if (!validateAddress(address)) throw new Error(`Invalid address: ${address}`);
			
			const accountKey = await lotus.getStateAccountKey(address);
			
			result = {
				idAddress: address,
				accountKey,
			};
			break;
		}
		
		case 'lookupId': {
			const address = this.getNodeParameter('address', index) as string;
			if (!validateAddress(address)) throw new Error(`Invalid address: ${address}`);
			
			const idAddress = await lotus.getStateLookupID(address);
			
			result = {
				robustAddress: address,
				idAddress,
			};
			break;
		}
		
		case 'listActors': {
			const limit = this.getNodeParameter('limit', index) as number;
			const actors = await lotus.stateListActors();
			
			result = {
				actors: actors.slice(0, limit),
				count: Math.min(actors.length, limit),
				total: actors.length,
			};
			break;
		}
		
		case 'readState': {
			const address = this.getNodeParameter('address', index) as string;
			if (!validateAddress(address)) throw new Error(`Invalid address: ${address}`);
			
			const state = await lotus.stateReadState(address);
			
			result = {
				address,
				balance: state.Balance,
				code: state.Code['/'],
				state: state.State,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
