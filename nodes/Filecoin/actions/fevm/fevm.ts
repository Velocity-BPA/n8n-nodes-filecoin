/**
 * FEVM Actions
 * Operations for Filecoin EVM interactions
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createFevmClient } from '../../transport/fevmClient';
import { ethers } from 'ethers';

export const fevmProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['fevm'],
			},
		},
		options: [
			{
				name: 'Get ETH Balance',
				value: 'getEthBalance',
				description: 'Get ETH/FIL balance of an address',
				action: 'Get ETH balance',
			},
			{
				name: 'Send Transaction',
				value: 'sendTransaction',
				description: 'Send ETH/FIL transaction',
				action: 'Send transaction',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by hash',
				action: 'Get transaction',
			},
			{
				name: 'Get Transaction Receipt',
				value: 'getReceipt',
				description: 'Get transaction receipt',
				action: 'Get transaction receipt',
			},
			{
				name: 'Estimate Gas',
				value: 'estimateGas',
				description: 'Estimate gas for a transaction',
				action: 'Estimate gas',
			},
			{
				name: 'Get Block',
				value: 'getBlock',
				description: 'Get block by number',
				action: 'Get block',
			},
			{
				name: 'Convert Address',
				value: 'convertAddress',
				description: 'Convert between f4 and 0x addresses',
				action: 'Convert address',
			},
		],
		default: 'getEthBalance',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Ethereum address (0x format) or Filecoin f4 address',
		displayOptions: {
			show: {
				resource: ['fevm'],
				operation: ['getEthBalance', 'convertAddress'],
			},
		},
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Recipient address',
		displayOptions: {
			show: {
				resource: ['fevm'],
				operation: ['sendTransaction', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'Value (FIL)',
		name: 'value',
		type: 'string',
		default: '0',
		description: 'Amount to send in FIL/ETH',
		displayOptions: {
			show: {
				resource: ['fevm'],
				operation: ['sendTransaction', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '',
		description: 'Transaction data (hex encoded)',
		displayOptions: {
			show: {
				resource: ['fevm'],
				operation: ['sendTransaction', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		default: '',
		required: true,
		description: 'Transaction hash to lookup',
		displayOptions: {
			show: {
				resource: ['fevm'],
				operation: ['getTransaction', 'getReceipt'],
			},
		},
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		default: 0,
		description: 'Block number (0 for latest)',
		displayOptions: {
			show: {
				resource: ['fevm'],
				operation: ['getBlock'],
			},
		},
	},
];

export async function executeFevmOperation(
	this: IExecuteFunctions,
	index: number
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('fevm');
	
	const fevm = createFevmClient({
		network: credentials.network as string,
		fevmRpcUrl: credentials.fevmRpcUrl as string,
		privateKey: credentials.privateKey as string,
		chainId: credentials.chainId as number,
	});
	
	let result: unknown;
	
	switch (operation) {
		case 'getEthBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const balance = await fevm.getBalance(address);
			const formatted = ethers.formatEther(balance);
			
			result = {
				address,
				balance: balance.toString(),
				balanceFormatted: `${formatted} FIL`,
			};
			break;
		}
		
		case 'sendTransaction': {
			const to = this.getNodeParameter('toAddress', index) as string;
			const valueStr = this.getNodeParameter('value', index) as string;
			
			// Convert FIL to wei
			const amount = ethers.parseEther(valueStr);
			const tx = await fevm.sendTransaction(to, amount);
			
			result = {
				success: true,
				transactionHash: tx.hash,
				from: tx.from,
				to: tx.to,
				value: tx.value?.toString(),
				nonce: tx.nonce,
			};
			break;
		}
		
		case 'getTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			const tx = await fevm.getTransaction(txHash);
			
			if (!tx) {
				throw new Error(`Transaction not found: ${txHash}`);
			}
			
			result = {
				hash: tx.hash,
				from: tx.from,
				to: tx.to,
				nonce: tx.nonce,
				gasLimit: tx.gasLimit?.toString(),
				gasPrice: tx.gasPrice?.toString(),
				value: tx.value?.toString(),
				data: tx.data,
				chainId: tx.chainId?.toString(),
				blockNumber: tx.blockNumber,
				blockHash: tx.blockHash,
			};
			break;
		}
		
		case 'getReceipt': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			const receipt = await fevm.getTransactionReceipt(txHash);
			
			if (!receipt) {
				throw new Error(`Receipt not found for: ${txHash}`);
			}
			
			result = {
				transactionHash: receipt.hash,
				from: receipt.from,
				to: receipt.to,
				status: receipt.status,
				success: receipt.status === 1,
				blockNumber: receipt.blockNumber,
				blockHash: receipt.blockHash,
				gasUsed: receipt.gasUsed?.toString(),
				cumulativeGasUsed: receipt.cumulativeGasUsed?.toString(),
				contractAddress: receipt.contractAddress,
				logs: receipt.logs?.length || 0,
			};
			break;
		}
		
		case 'estimateGas': {
			const to = this.getNodeParameter('toAddress', index) as string;
			const valueStr = this.getNodeParameter('value', index) as string;
			const data = this.getNodeParameter('data', index) as string;
			
			const value = ethers.parseEther(valueStr);
			const gasEstimate = await fevm.estimateGas({
				to,
				value,
				data: data || undefined,
			});
			
			result = {
				gasEstimate: gasEstimate.toString(),
				gasEstimateFormatted: `${gasEstimate} units`,
			};
			break;
		}
		
		case 'getBlock': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;
			const blockTag = blockNumber === 0 ? 'latest' : blockNumber;
			const block = await fevm.getBlock(blockTag);
			
			if (!block) {
				throw new Error(`Block not found: ${blockNumber}`);
			}
			
			result = {
				number: block.number,
				hash: block.hash,
				parentHash: block.parentHash,
				timestamp: block.timestamp,
				timestampDate: new Date(Number(block.timestamp) * 1000).toISOString(),
				nonce: block.nonce,
				miner: block.miner,
				gasLimit: block.gasLimit?.toString(),
				gasUsed: block.gasUsed?.toString(),
				baseFeePerGas: block.baseFeePerGas?.toString(),
				transactions: block.transactions?.length || 0,
			};
			break;
		}
		
		case 'convertAddress': {
			const address = this.getNodeParameter('address', index) as string;
			
			// Simple address format detection and display
			let addressType: string;
			let normalized: string;
			
			if (address.startsWith('0x')) {
				addressType = 'Ethereum (0x)';
				normalized = address.toLowerCase();
			} else if (address.startsWith('f4') || address.startsWith('t4')) {
				addressType = 'Filecoin f4';
				normalized = address;
			} else {
				throw new Error('Unknown address format. Use 0x or f4/t4 format.');
			}
			
			result = {
				original: address,
				addressType,
				normalized,
				note: 'For full address conversion, use external tools or the Filecoin StateAccountKey API',
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
