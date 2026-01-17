/**
 * Chain Actions
 * Operations for Filecoin blockchain data
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { formatFil } from '../../utils/unitConverter';

export const chainProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['chain'] } },
		options: [
			{ name: 'Get Chain Head', value: 'getChainHead', description: 'Get current chain head', action: 'Get chain head' },
			{ name: 'Get Tipset by Height', value: 'getTipsetByHeight', description: 'Get tipset at specific height', action: 'Get tipset by height' },
			{ name: 'Get Block', value: 'getBlock', description: 'Get block by CID', action: 'Get block' },
			{ name: 'Get Block Messages', value: 'getBlockMessages', description: 'Get messages in a block', action: 'Get block messages' },
			{ name: 'Get Genesis', value: 'getGenesis', description: 'Get genesis tipset', action: 'Get genesis' },
			{ name: 'Get Network Name', value: 'getNetworkName', description: 'Get network name', action: 'Get network name' },
			{ name: 'Get Network Version', value: 'getNetworkVersion', description: 'Get network version', action: 'Get network version' },
			{ name: 'Get Circulating Supply', value: 'getCirculatingSupply', description: 'Get circulating FIL supply', action: 'Get circulating supply' },
		],
		default: 'getChainHead',
	},
	{
		displayName: 'Height',
		name: 'height',
		type: 'number',
		default: 0,
		required: true,
		description: 'Chain height (epoch number)',
		displayOptions: { show: { resource: ['chain'], operation: ['getTipsetByHeight'] } },
	},
	{
		displayName: 'Block CID',
		name: 'blockCid',
		type: 'string',
		default: '',
		required: true,
		description: 'Block CID',
		displayOptions: { show: { resource: ['chain'], operation: ['getBlock', 'getBlockMessages'] } },
	},
];

export async function executeChainOperation(
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
		case 'getChainHead': {
			const head = await lotus.getChainHead();
			
			result = {
				height: head.Height,
				cids: head.Cids.map((c: { '/': string }) => c['/']),
				blocksCount: head.Blocks.length,
				baseFee: head.Blocks[0]?.ParentBaseFee,
				baseFeeFormatted: formatFil(head.Blocks[0]?.ParentBaseFee || '0') + ' FIL',
				timestamp: head.Blocks[0]?.Timestamp,
				timestampDate: new Date(head.Blocks[0]?.Timestamp * 1000).toISOString(),
			};
			break;
		}
		
		case 'getTipsetByHeight': {
			const height = this.getNodeParameter('height', index) as number;
			const tipset = await lotus.getChainGetTipSetByHeight(height);
			
			result = {
				height: tipset.Height,
				cids: tipset.Cids.map((c: { '/': string }) => c['/']),
				blocksCount: tipset.Blocks.length,
				baseFee: tipset.Blocks[0]?.ParentBaseFee,
				timestamp: tipset.Blocks[0]?.Timestamp,
				timestampDate: new Date(tipset.Blocks[0]?.Timestamp * 1000).toISOString(),
				miners: tipset.Blocks.map((b: { Miner: string }) => b.Miner),
			};
			break;
		}
		
		case 'getBlock': {
			const cid = this.getNodeParameter('blockCid', index) as string;
			const block = await lotus.getChainGetBlock({ '/': cid });
			
			result = {
				cid,
				miner: block.Miner,
				height: block.Height,
				parentWeight: block.ParentWeight,
				parentBaseFee: block.ParentBaseFee,
				parentStateRoot: block.ParentStateRoot['/'],
				messagesRoot: block.Messages['/'],
				timestamp: block.Timestamp,
				timestampDate: new Date(block.Timestamp * 1000).toISOString(),
				ticketVRFProof: block.Ticket?.VRFProof,
				beaconEntries: block.BeaconEntries?.length || 0,
				winCount: block.ElectionProof?.WinCount,
			};
			break;
		}
		
		case 'getBlockMessages': {
			const cid = this.getNodeParameter('blockCid', index) as string;
			const messages = await lotus.getChainGetBlockMessages({ '/': cid });
			
			result = {
				blockCid: cid,
				blsMessages: messages.BlsMessages.map((m: { From: string; To: string; Value: string; Method: number; Nonce: number }) => ({
					from: m.From,
					to: m.To,
					value: m.Value,
					valueFormatted: formatFil(m.Value) + ' FIL',
					method: m.Method,
					nonce: m.Nonce,
				})),
				secpMessages: messages.SecpkMessages.map((m: { Message: { From: string; To: string; Value: string; Method: number; Nonce: number } }) => ({
					from: m.Message.From,
					to: m.Message.To,
					value: m.Message.Value,
					valueFormatted: formatFil(m.Message.Value) + ' FIL',
					method: m.Message.Method,
					nonce: m.Message.Nonce,
				})),
				totalMessages: messages.BlsMessages.length + messages.SecpkMessages.length,
			};
			break;
		}
		
		case 'getGenesis': {
			const genesis = await lotus.getChainGetGenesis();
			
			result = {
				height: genesis.Height,
				cids: genesis.Cids.map((c: { '/': string }) => c['/']),
				timestamp: genesis.Blocks[0]?.Timestamp,
				timestampDate: new Date(genesis.Blocks[0]?.Timestamp * 1000).toISOString(),
			};
			break;
		}
		
		case 'getNetworkName': {
			const networkName = await lotus.getStateNetworkName();
			
			result = {
				networkName,
				isMainnet: networkName === 'mainnet',
				isCalibration: networkName === 'calibrationnet',
			};
			break;
		}
		
		case 'getNetworkVersion': {
			const version = await lotus.getStateNetworkVersion();
			const head = await lotus.getChainHead();
			
			result = {
				networkVersion: version,
				currentHeight: head.Height,
			};
			break;
		}
		
		case 'getCirculatingSupply': {
			const supply = await lotus.getStateCirculatingSupply();
			
			result = {
				filVested: supply.FilVested,
				filVestedFormatted: formatFil(supply.FilVested) + ' FIL',
				filMined: supply.FilMined,
				filMinedFormatted: formatFil(supply.FilMined) + ' FIL',
				filBurnt: supply.FilBurnt,
				filBurntFormatted: formatFil(supply.FilBurnt) + ' FIL',
				filLocked: supply.FilLocked,
				filLockedFormatted: formatFil(supply.FilLocked) + ' FIL',
				filCirculating: supply.FilCirculating,
				filCirculatingFormatted: formatFil(supply.FilCirculating) + ' FIL',
				filReserveDisbursed: supply.FilReserveDisbursed,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
