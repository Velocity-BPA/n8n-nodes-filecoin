/**
 * Transaction Actions
 * Operations for Filecoin transactions and messages
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient, SignedMessage } from '../../transport/lotusClient';
import { attoFilToFil, filToAttoFil, formatFil } from '../../utils/unitConverter';
import { validateAddress } from '../../utils/addressUtils';

export const transactionProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['transaction'] } },
		options: [
			{ name: 'Send FIL', value: 'sendFil', description: 'Send FIL to an address', action: 'Send FIL' },
			{ name: 'Get Message', value: 'getMessage', description: 'Get message by CID', action: 'Get message' },
			{ name: 'Get Message Receipt', value: 'getMessageReceipt', description: 'Get receipt for a message', action: 'Get message receipt' },
			{ name: 'Wait for Message', value: 'waitForMessage', description: 'Wait for message confirmation', action: 'Wait for message' },
			{ name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate gas for a message', action: 'Estimate gas' },
			{ name: 'Get Base Fee', value: 'getBaseFee', description: 'Get current base fee', action: 'Get base fee' },
			{ name: 'Get Pending Messages', value: 'getPendingMessages', description: 'Get pending messages in mempool', action: 'Get pending messages' },
			{ name: 'Push Message', value: 'pushMessage', description: 'Push a signed message to the network', action: 'Push message' },
			{ name: 'Get Chain Head', value: 'getChainHead', description: 'Get current chain head', action: 'Get chain head' },
			{ name: 'Get Nonce', value: 'getNonce', description: 'Get nonce for an address', action: 'Get nonce' },
		],
		default: 'sendFil',
	},
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Sender address',
		displayOptions: { show: { resource: ['transaction'], operation: ['sendFil', 'estimateGas'] } },
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Recipient address',
		displayOptions: { show: { resource: ['transaction'], operation: ['sendFil', 'estimateGas'] } },
	},
	{
		displayName: 'Amount (FIL)',
		name: 'amount',
		type: 'number',
		default: 0,
		required: true,
		description: 'Amount to send in FIL',
		displayOptions: { show: { resource: ['transaction'], operation: ['sendFil', 'estimateGas'] } },
	},
	{
		displayName: 'Message CID',
		name: 'messageCid',
		type: 'string',
		default: '',
		required: true,
		description: 'Message CID to query',
		displayOptions: { show: { resource: ['transaction'], operation: ['getMessage', 'getMessageReceipt', 'waitForMessage'] } },
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Address to query',
		displayOptions: { show: { resource: ['transaction'], operation: ['getPendingMessages', 'getNonce'] } },
	},
	{
		displayName: 'Signed Message',
		name: 'signedMessage',
		type: 'json',
		default: '{}',
		required: true,
		description: 'Signed message JSON',
		displayOptions: { show: { resource: ['transaction'], operation: ['pushMessage'] } },
	},
	{
		displayName: 'Confidence',
		name: 'confidence',
		type: 'number',
		default: 5,
		description: 'Number of confirmations to wait for',
		displayOptions: { show: { resource: ['transaction'], operation: ['waitForMessage'] } },
	},
];

export async function executeTransactionOperation(
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
		case 'sendFil': {
			const from = this.getNodeParameter('fromAddress', index) as string;
			const to = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			
			if (!validateAddress(from)) throw new Error(`Invalid from address: ${from}`);
			if (!validateAddress(to)) throw new Error(`Invalid to address: ${to}`);
			
			const valueAtto = filToAttoFil(amount.toString());
			
			const message = {
				To: to,
				From: from,
				Value: valueAtto,
				Method: 0,
				Params: '',
			};
			
			const signedMsg = await lotus.mpoolPushMessage(message, { MaxFee: '0' });
			const cid = signedMsg.CID['/'];
			
			result = {
				success: true,
				messageCid: cid,
				from,
				to,
				amountFil: amount,
				amountAttoFil: valueAtto,
			};
			break;
		}
		
		case 'getMessage': {
			const cid = this.getNodeParameter('messageCid', index) as string;
			const msg = await lotus.getChainGetMessage({ '/': cid });
			
			result = {
				cid,
				from: msg.From,
				to: msg.To,
				value: attoFilToFil(msg.Value),
				valueFormatted: formatFil(msg.Value) + ' FIL',
				method: msg.Method,
				nonce: msg.Nonce,
				gasLimit: msg.GasLimit,
				gasFeeCap: msg.GasFeeCap,
				gasPremium: msg.GasPremium,
			};
			break;
		}
		
		case 'getMessageReceipt': {
			const cid = this.getNodeParameter('messageCid', index) as string;
			const receipt = await lotus.stateGetReceipt({ '/': cid });
			
			result = {
				cid,
				exitCode: receipt.ExitCode,
				return: receipt.Return,
				gasUsed: receipt.GasUsed,
				success: receipt.ExitCode === 0,
			};
			break;
		}
		
		case 'waitForMessage': {
			const cid = this.getNodeParameter('messageCid', index) as string;
			const confidence = this.getNodeParameter('confidence', index) as number;
			
			const lookup = await lotus.stateWaitMsg({ '/': cid }, confidence);
			
			result = {
				cid,
				height: lookup.Height,
				tipSet: lookup.TipSet,
				receipt: {
					exitCode: lookup.Receipt.ExitCode,
					return: lookup.Receipt.Return,
					gasUsed: lookup.Receipt.GasUsed,
					success: lookup.Receipt.ExitCode === 0,
				},
			};
			break;
		}
		
		case 'estimateGas': {
			const from = this.getNodeParameter('fromAddress', index) as string;
			const to = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			
			const message = {
				To: to,
				From: from,
				Value: filToAttoFil(amount.toString()),
				Method: 0,
				Params: '',
			};
			
			const estimated = await lotus.gasEstimateMessageGas(message, { MaxFee: '0' });
			
			result = {
				gasLimit: estimated.GasLimit,
				gasFeeCap: estimated.GasFeeCap,
				gasPremium: estimated.GasPremium,
				estimatedCost: formatFil(
					(BigInt(estimated.GasLimit) * BigInt(estimated.GasFeeCap)).toString()
				) + ' FIL',
			};
			break;
		}
		
		case 'getBaseFee': {
			const head = await lotus.getChainHead();
			const baseFee = head.Blocks[0]?.ParentBaseFee || '0';
			
			result = {
				baseFee,
				baseFeeFormatted: formatFil(baseFee) + ' FIL',
				height: head.Height,
			};
			break;
		}
		
		case 'getPendingMessages': {
			const address = this.getNodeParameter('address', index) as string;
			
			if (!validateAddress(address)) throw new Error(`Invalid address: ${address}`);
			
			const pending = await lotus.mpoolPending([]);
			const filtered = pending.filter(
				(msg) =>
					msg.Message.From === address || msg.Message.To === address
			);
			
			result = {
				address,
				pendingCount: filtered.length,
				messages: filtered.slice(0, 50).map((msg) => ({
					cid: msg.CID?.['/'] || 'pending',
					from: msg.Message.From,
					to: msg.Message.To,
					value: formatFil(msg.Message.Value) + ' FIL',
					nonce: msg.Message.Nonce,
				})),
			};
			break;
		}
		
		case 'pushMessage': {
			const signedMessage = this.getNodeParameter('signedMessage', index) as string;
			const msgObj = JSON.parse(signedMessage);
			const cid = await lotus.mpoolPush(msgObj as SignedMessage);
			
			result = {
				success: true,
				messageCid: cid['/'],
			};
			break;
		}
		
		case 'getChainHead': {
			const head = await lotus.getChainHead();
			
			result = {
				height: head.Height,
				cids: head.Cids.map((c: { '/': string }) => c['/']),
				blocks: head.Blocks.length,
				baseFee: head.Blocks[0]?.ParentBaseFee,
				timestamp: head.Blocks[0]?.Timestamp,
			};
			break;
		}
		
		case 'getNonce': {
			const address = this.getNodeParameter('address', index) as string;
			
			if (!validateAddress(address)) throw new Error(`Invalid address: ${address}`);
			
			const nonce = await lotus.mpoolGetNonce(address);
			
			result = { address, nonce };
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
