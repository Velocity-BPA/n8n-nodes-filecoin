/**
 * Gas Actions
 * Operations for Filecoin gas estimation
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { formatFil, filToAttoFil } from '../../utils/unitConverter';
import { validateAddress } from '../../utils/addressUtils';

export const gasProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['gas'] } },
		options: [
			{ name: 'Estimate Message Gas', value: 'estimateMessageGas', description: 'Estimate gas for a message', action: 'Estimate message gas' },
			{ name: 'Estimate Gas Limit', value: 'estimateGasLimit', description: 'Estimate gas limit', action: 'Estimate gas limit' },
			{ name: 'Estimate Gas Premium', value: 'estimateGasPremium', description: 'Estimate gas premium', action: 'Estimate gas premium' },
			{ name: 'Get Base Fee', value: 'getBaseFee', description: 'Get current base fee', action: 'Get base fee' },
		],
		default: 'estimateMessageGas',
	},
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Sender address',
		displayOptions: { show: { resource: ['gas'], operation: ['estimateMessageGas', 'estimateGasLimit', 'estimateGasPremium'] } },
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Recipient address',
		displayOptions: { show: { resource: ['gas'], operation: ['estimateMessageGas', 'estimateGasLimit', 'estimateGasPremium'] } },
	},
	{
		displayName: 'Value (FIL)',
		name: 'value',
		type: 'number',
		default: 0,
		description: 'Amount in FIL',
		displayOptions: { show: { resource: ['gas'], operation: ['estimateMessageGas', 'estimateGasLimit'] } },
	},
	{
		displayName: 'Method',
		name: 'method',
		type: 'number',
		default: 0,
		description: 'Actor method number (0 for transfer)',
		displayOptions: { show: { resource: ['gas'], operation: ['estimateMessageGas', 'estimateGasLimit'] } },
	},
	{
		displayName: 'Max Fee (FIL)',
		name: 'maxFee',
		type: 'string',
		default: '0.1',
		description: 'Maximum fee willing to pay',
		displayOptions: { show: { resource: ['gas'], operation: ['estimateMessageGas'] } },
	},
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'number',
		default: 0,
		description: 'Estimated gas limit',
		displayOptions: { show: { resource: ['gas'], operation: ['estimateGasPremium'] } },
	},
];

export async function executeGasOperation(
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
		case 'estimateMessageGas': {
			const from = this.getNodeParameter('fromAddress', index) as string;
			const to = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const method = this.getNodeParameter('method', index) as number;
			const maxFee = this.getNodeParameter('maxFee', index) as string;
			
			if (!validateAddress(from)) throw new Error(`Invalid from address: ${from}`);
			if (!validateAddress(to)) throw new Error(`Invalid to address: ${to}`);
			
			const message = {
				To: to,
				From: from,
				Value: filToAttoFil(value.toString()),
				Method: method,
				Params: '',
			};
			
			const estimated = await lotus.gasEstimateMessageGas(message, { MaxFee: filToAttoFil(maxFee) });
			
			const totalCost = BigInt(estimated.GasLimit) * BigInt(estimated.GasFeeCap);
			
			result = {
				gasLimit: estimated.GasLimit,
				gasFeeCap: estimated.GasFeeCap,
				gasFeeCapFormatted: formatFil(estimated.GasFeeCap) + ' FIL',
				gasPremium: estimated.GasPremium,
				gasPremiumFormatted: formatFil(estimated.GasPremium) + ' FIL',
				estimatedTotalCost: totalCost.toString(),
				estimatedTotalCostFormatted: formatFil(totalCost.toString()) + ' FIL',
			};
			break;
		}
		
		case 'estimateGasLimit': {
			const from = this.getNodeParameter('fromAddress', index) as string;
			const to = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as number;
			const method = this.getNodeParameter('method', index) as number;
			
			if (!validateAddress(from)) throw new Error(`Invalid from address: ${from}`);
			if (!validateAddress(to)) throw new Error(`Invalid to address: ${to}`);
			
			const message = {
				To: to,
				From: from,
				Value: filToAttoFil(value.toString()),
				Method: method,
				Params: '',
				GasLimit: 0,
				GasFeeCap: '0',
				GasPremium: '0',
			};
			
			const gasLimit = await lotus.gasEstimateGasLimit(message);
			
			result = {
				gasLimit,
				gasLimitWithBuffer: Math.ceil(gasLimit * 1.25),
			};
			break;
		}
		
		case 'estimateGasPremium': {
			const from = this.getNodeParameter('fromAddress', index) as string;
			const gasLimit = this.getNodeParameter('gasLimit', index) as number;
			
			if (!validateAddress(from)) throw new Error(`Invalid from address: ${from}`);
			
			const premium = await lotus.gasEstimateGasPremium(gasLimit > 0 ? gasLimit : 1000000, from, 10);
			
			result = {
				gasPremium: premium,
				gasPremiumFormatted: formatFil(premium) + ' FIL',
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
				timestamp: head.Blocks[0]?.Timestamp,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
