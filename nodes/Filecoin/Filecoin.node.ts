/**
 * Filecoin Node
 * n8n community node for Filecoin blockchain operations
 * 
 * Author: Velocity BPA
 * Website: velobpa.com
 * GitHub: https://github.com/Velocity-BPA/n8n-nodes-filecoin
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// Import action properties and executors
import { walletProperties, executeWalletOperation } from './actions/wallet/wallet';
import { transactionProperties, executeTransactionOperation } from './actions/transaction/transaction';
import { storageDealProperties, executeStorageDealOperation } from './actions/storageDeal/storageDeal';
import { storageProviderProperties, executeStorageProviderOperation } from './actions/storageProvider/storageProvider';
import { retrievalProperties, executeRetrievalOperation } from './actions/retrieval/retrieval';
import { datacapProperties, executeDatacapOperation } from './actions/datacap/datacap';
import { sectorProperties, executeSectorOperation } from './actions/sector/sector';
import { powerProperties, executePowerOperation } from './actions/power/power';
import { marketProperties, executeMarketOperation } from './actions/market/market';
import { minerProperties, executeMinerOperation } from './actions/miner/miner';
import { fevmProperties, executeFevmOperation } from './actions/fevm/fevm';
import { fvmProperties, executeFvmOperation } from './actions/fvm/fvm';
import { chainProperties, executeChainOperation } from './actions/chain/chain';
import { stateProperties, executeStateOperation } from './actions/state/state';
import { gasProperties, executeGasOperation } from './actions/gas/gas';
import { multisigProperties, executeMultisigOperation } from './actions/multisig/multisig';
import { paymentChannelProperties, executePaymentChannelOperation } from './actions/paymentChannel/paymentChannel';
import { ipfsProperties, executeIpfsOperation } from './actions/ipfs/ipfs';
import { utilityProperties, executeUtilityOperation } from './actions/utility/utility';

export class Filecoin implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Filecoin',
		name: 'filecoin',
		icon: 'file:filecoin.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Filecoin blockchain - storage deals, wallets, FEVM, and more',
		defaults: {
			name: 'Filecoin',
		},
		// @ts-ignore - n8n accepts both string and enum formats
		inputs: ['main'],
		// @ts-ignore - n8n accepts both string and enum formats
		outputs: ['main'],
		credentials: [
			{
				name: 'filecoinNetwork',
				required: true,
			},
			{
				name: 'storageProvider',
				required: false,
			},
			{
				name: 'fevm',
				required: false,
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chain',
						value: 'chain',
						description: 'Chain and tipset operations',
					},
					{
						name: 'DataCap',
						value: 'datacap',
						description: 'Fil+ DataCap operations',
					},
					{
						name: 'FEVM',
						value: 'fevm',
						description: 'Filecoin EVM operations',
					},
					{
						name: 'FVM',
						value: 'fvm',
						description: 'Filecoin Virtual Machine operations',
					},
					{
						name: 'Gas',
						value: 'gas',
						description: 'Gas estimation operations',
					},
					{
						name: 'IPFS',
						value: 'ipfs',
						description: 'IPFS integration operations',
					},
					{
						name: 'Market',
						value: 'market',
						description: 'Storage market operations',
					},
					{
						name: 'Miner',
						value: 'miner',
						description: 'Storage miner operations',
					},
					{
						name: 'Multisig',
						value: 'multisig',
						description: 'Multisig wallet operations',
					},
					{
						name: 'Payment Channel',
						value: 'paymentChannel',
						description: 'Payment channel operations',
					},
					{
						name: 'Power',
						value: 'power',
						description: 'Network power operations',
					},
					{
						name: 'Retrieval',
						value: 'retrieval',
						description: 'Data retrieval operations',
					},
					{
						name: 'Sector',
						value: 'sector',
						description: 'Sector management operations',
					},
					{
						name: 'State',
						value: 'state',
						description: 'Chain state operations',
					},
					{
						name: 'Storage Deal',
						value: 'storageDeal',
						description: 'Storage deal operations',
					},
					{
						name: 'Storage Provider',
						value: 'storageProvider',
						description: 'Storage provider operations',
					},
					{
						name: 'Transaction',
						value: 'transaction',
						description: 'Transaction and message operations',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility and helper operations',
					},
					{
						name: 'Wallet',
						value: 'wallet',
						description: 'Wallet operations',
					},
				],
				default: 'wallet',
			},
			// Include all resource-specific properties
			...walletProperties,
			...transactionProperties,
			...storageDealProperties,
			...storageProviderProperties,
			...retrievalProperties,
			...datacapProperties,
			...sectorProperties,
			...powerProperties,
			...marketProperties,
			...minerProperties,
			...fevmProperties,
			...fvmProperties,
			...chainProperties,
			...stateProperties,
			...gasProperties,
			...multisigProperties,
			...paymentChannelProperties,
			...ipfsProperties,
			...utilityProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				let result: INodeExecutionData[];

				switch (resource) {
					case 'wallet':
						result = await executeWalletOperation.call(this, i);
						break;
					case 'transaction':
						result = await executeTransactionOperation.call(this, i);
						break;
					case 'storageDeal':
						result = await executeStorageDealOperation.call(this, i);
						break;
					case 'storageProvider':
						result = await executeStorageProviderOperation.call(this, i);
						break;
					case 'retrieval':
						result = await executeRetrievalOperation.call(this, i);
						break;
					case 'datacap':
						result = await executeDatacapOperation.call(this, i);
						break;
					case 'sector':
						result = await executeSectorOperation.call(this, i);
						break;
					case 'power':
						result = await executePowerOperation.call(this, i);
						break;
					case 'market':
						result = await executeMarketOperation.call(this, i);
						break;
					case 'miner':
						result = await executeMinerOperation.call(this, i);
						break;
					case 'fevm':
						result = await executeFevmOperation.call(this, i);
						break;
					case 'fvm':
						result = await executeFvmOperation.call(this, i);
						break;
					case 'chain':
						result = await executeChainOperation.call(this, i);
						break;
					case 'state':
						result = await executeStateOperation.call(this, i);
						break;
					case 'gas':
						result = await executeGasOperation.call(this, i);
						break;
					case 'multisig':
						result = await executeMultisigOperation.call(this, i);
						break;
					case 'paymentChannel':
						result = await executePaymentChannelOperation.call(this, i);
						break;
					case 'ipfs':
						result = await executeIpfsOperation.call(this, i);
						break;
					case 'utility':
						result = await executeUtilityOperation.call(this, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown error',
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
