/**
 * FVM Actions
 * Operations for Filecoin Virtual Machine
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { validateAddress } from '../../utils/addressUtils';

export const fvmProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['fvm'],
			},
		},
		options: [
			{
				name: 'Get Actor State',
				value: 'getActorState',
				description: 'Get state of an actor',
				action: 'Get actor state',
			},
			{
				name: 'Get Actor',
				value: 'getActor',
				description: 'Get actor by address',
				action: 'Get actor',
			},
			{
				name: 'List Actors',
				value: 'listActors',
				description: 'List all actors',
				action: 'List actors',
			},
			{
				name: 'Get Built-in Actors',
				value: 'getBuiltinActors',
				description: 'Get built-in actor information',
				action: 'Get built-in actors',
			},
			{
				name: 'Get State Root',
				value: 'getStateRoot',
				description: 'Get the state root CID',
				action: 'Get state root',
			},
			{
				name: 'Read State',
				value: 'readState',
				description: 'Read full actor state',
				action: 'Read state',
			},
			{
				name: 'Get Network Version',
				value: 'getNetworkVersion',
				description: 'Get the FVM network version',
				action: 'Get network version',
			},
			{
				name: 'Invoke Actor',
				value: 'invokeActor',
				description: 'Invoke an actor method (read-only)',
				action: 'Invoke actor',
			},
		],
		default: 'getActorState',
	},
	{
		displayName: 'Actor Address',
		name: 'actorAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Address of the actor',
		displayOptions: {
			show: {
				resource: ['fvm'],
				operation: ['getActorState', 'getActor', 'readState', 'invokeActor'],
			},
		},
	},
	{
		displayName: 'Method Number',
		name: 'methodNum',
		type: 'number',
		default: 0,
		description: 'Actor method number to invoke',
		displayOptions: {
			show: {
				resource: ['fvm'],
				operation: ['invokeActor'],
			},
		},
	},
	{
		displayName: 'Parameters (Base64)',
		name: 'params',
		type: 'string',
		default: '',
		description: 'Method parameters encoded in base64',
		displayOptions: {
			show: {
				resource: ['fvm'],
				operation: ['invokeActor'],
			},
		},
	},
];

export async function executeFvmOperation(
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
		case 'getActorState': {
			const actorAddress = this.getNodeParameter('actorAddress', index) as string;
			
			if (!validateAddress(actorAddress)) {
				throw new Error(`Invalid actor address: ${actorAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const actor = await lotus.getStateGetActor(actorAddress, chainHead.Cids);
			
			result = {
				address: actorAddress,
				code: actor.Code?.['/'],
				head: actor.Head?.['/'],
				nonce: actor.Nonce,
				balance: actor.Balance,
			};
			break;
		}
		
		case 'getActor': {
			const actorAddress = this.getNodeParameter('actorAddress', index) as string;
			
			if (!validateAddress(actorAddress)) {
				throw new Error(`Invalid actor address: ${actorAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const actor = await lotus.getStateGetActor(actorAddress, chainHead.Cids);
			
			// Determine actor type from code CID
			const codeStr = actor.Code?.['/'] || '';
			let actorType = 'unknown';
			
			if (codeStr.includes('account')) actorType = 'account';
			else if (codeStr.includes('miner')) actorType = 'storageminer';
			else if (codeStr.includes('market')) actorType = 'storagemarket';
			else if (codeStr.includes('power')) actorType = 'storagepower';
			else if (codeStr.includes('multisig')) actorType = 'multisig';
			else if (codeStr.includes('paymentchannel')) actorType = 'paymentchannel';
			else if (codeStr.includes('init')) actorType = 'init';
			else if (codeStr.includes('reward')) actorType = 'reward';
			else if (codeStr.includes('cron')) actorType = 'cron';
			else if (codeStr.includes('evm')) actorType = 'evm';
			else if (codeStr.includes('eam')) actorType = 'eam';
			else if (codeStr.includes('ethaccount')) actorType = 'ethaccount';
			else if (codeStr.includes('datacap')) actorType = 'datacap';
			else if (codeStr.includes('verifreg')) actorType = 'verifiedregistry';
			
			result = {
				address: actorAddress,
				actorType,
				code: actor.Code?.['/'],
				head: actor.Head?.['/'],
				nonce: actor.Nonce,
				balance: actor.Balance,
			};
			break;
		}
		
		case 'listActors': {
			const chainHead = await lotus.getChainHead();
			const actors = await lotus.getStateListActors(chainHead.Cids);
			
			result = {
				actors: actors?.slice(0, 100) || [],
				totalCount: actors?.length || 0,
				note: 'Showing first 100 actors',
			};
			break;
		}
		
		case 'getBuiltinActors': {
			const builtinActors = {
				system: {
					address: 'f00',
					description: 'System actor - handles network initialization',
				},
				init: {
					address: 'f01',
					description: 'Init actor - creates new actors and manages ID address assignment',
				},
				reward: {
					address: 'f02',
					description: 'Reward actor - manages block rewards distribution',
				},
				cron: {
					address: 'f03',
					description: 'Cron actor - handles scheduled system tasks',
				},
				power: {
					address: 'f04',
					description: 'Storage power actor - tracks network storage power',
				},
				market: {
					address: 'f05',
					description: 'Storage market actor - manages storage deals',
				},
				verifiedRegistry: {
					address: 'f06',
					description: 'Verified registry actor - manages DataCap allocations',
				},
				datacap: {
					address: 'f07',
					description: 'DataCap actor - manages DataCap tokens',
				},
				eam: {
					address: 'f010',
					description: 'Ethereum Address Manager - handles f4/0x address mapping',
				},
				burnt: {
					address: 'f099',
					description: 'Burnt funds actor - holds burned FIL',
				},
			};
			
			result = {
				builtinActors,
				count: Object.keys(builtinActors).length,
			};
			break;
		}
		
		case 'getStateRoot': {
			const chainHead = await lotus.getChainHead();
			
			result = {
				stateRoot: chainHead.Blocks?.[0]?.ParentStateRoot?.['/'],
				height: chainHead.Height,
				tipsetCids: chainHead.Cids,
			};
			break;
		}
		
		case 'readState': {
			const actorAddress = this.getNodeParameter('actorAddress', index) as string;
			
			if (!validateAddress(actorAddress)) {
				throw new Error(`Invalid actor address: ${actorAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const state = await lotus.getStateReadState(actorAddress, chainHead.Cids);
			
			result = {
				address: actorAddress,
				balance: state.Balance,
				code: state.Code?.['/'],
				state: state.State,
			};
			break;
		}
		
		case 'getNetworkVersion': {
			const chainHead = await lotus.getChainHead();
			const networkVersion = await lotus.getStateNetworkVersion(chainHead.Cids);
			const networkName = await lotus.getStateNetworkName();
			
			// Network version mapping
			const versionNames: { [key: number]: string } = {
				16: 'nv16 - Skyr',
				17: 'nv17 - Shark',
				18: 'nv18 - Hygge',
				19: 'nv19 - Lightning',
				20: 'nv20 - Thunder',
				21: 'nv21 - Watermelon',
				22: 'nv22 - Dragon',
				23: 'nv23 - Waffle',
				24: 'nv24 - TukTuk',
			};
			
			result = {
				networkVersion,
				networkVersionName: versionNames[networkVersion] || `nv${networkVersion}`,
				networkName,
				chainHeight: chainHead.Height,
			};
			break;
		}
		
		case 'invokeActor': {
			const actorAddress = this.getNodeParameter('actorAddress', index) as string;
			const methodNum = this.getNodeParameter('methodNum', index) as number;
			const params = this.getNodeParameter('params', index, '') as string;
			
			if (!validateAddress(actorAddress)) {
				throw new Error(`Invalid actor address: ${actorAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const fromAddress = await lotus.getWalletDefaultAddress();
			
			// Build read-only call message
			const message = {
				To: actorAddress,
				From: fromAddress,
				Value: '0',
				Method: methodNum,
				Params: params || null,
				GasLimit: 0,
				GasFeeCap: '0',
				GasPremium: '0',
			};
			
			const callResult = await lotus.stateCall(message, chainHead.Cids);
			
			result = {
				actor: actorAddress,
				method: methodNum,
				exitCode: callResult.MsgRct?.ExitCode,
				return: callResult.MsgRct?.Return,
				gasUsed: callResult.MsgRct?.GasUsed,
				executionTrace: callResult.ExecutionTrace ? 'Available' : 'Not available',
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
