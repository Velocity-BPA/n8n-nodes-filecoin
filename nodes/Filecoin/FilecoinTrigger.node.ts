/**
 * Filecoin Trigger Node
 * n8n community node for Filecoin blockchain event monitoring
 * 
 * Author: Velocity BPA
 * Website: velobpa.com
 * GitHub: https://github.com/Velocity-BPA/n8n-nodes-filecoin
 */

import {
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { createLotusClient } from './transport/lotusClient';
import { attoFilToFil, formatFil } from './utils/unitConverter';
import { validateAddress } from './utils/addressUtils';

export class FilecoinTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Filecoin Trigger',
		name: 'filecoinTrigger',
		icon: 'file:filecoin.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["triggerType"]}}',
		description: 'Trigger workflows on Filecoin blockchain events',
		defaults: {
			name: 'Filecoin Trigger',
		},
		inputs: [],
		// @ts-ignore - n8n accepts both string and enum formats
		outputs: ['main'],
		credentials: [
			{
				name: 'filecoinNetwork',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'New Tipset',
						value: 'newTipset',
						description: 'Trigger on new chain tipset (block)',
					},
					{
						name: 'Address Balance Changed',
						value: 'balanceChanged',
						description: 'Trigger when an address balance changes',
					},
					{
						name: 'Message Confirmed',
						value: 'messageConfirmed',
						description: 'Trigger when a specific message is confirmed',
					},
					{
						name: 'FIL Received',
						value: 'filReceived',
						description: 'Trigger when FIL is received at an address',
					},
					{
						name: 'Deal Status Changed',
						value: 'dealStatusChanged',
						description: 'Trigger when a storage deal status changes',
					},
					{
						name: 'Miner Power Changed',
						value: 'minerPowerChanged',
						description: 'Trigger when a miner\'s power changes',
					},
					{
						name: 'Base Fee Changed',
						value: 'baseFeeChanged',
						description: 'Trigger when base fee changes significantly',
					},
				],
				default: 'newTipset',
			},
			// Address for balance/receive triggers
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				required: true,
				description: 'Filecoin address to monitor',
				displayOptions: {
					show: {
						triggerType: ['balanceChanged', 'filReceived'],
					},
				},
			},
			// Message CID for confirmation trigger
			{
				displayName: 'Message CID',
				name: 'messageCid',
				type: 'string',
				default: '',
				required: true,
				description: 'CID of the message to monitor',
				displayOptions: {
					show: {
						triggerType: ['messageConfirmed'],
					},
				},
			},
			// Deal ID for deal status trigger
			{
				displayName: 'Deal ID',
				name: 'dealId',
				type: 'number',
				default: 0,
				required: true,
				description: 'Deal ID to monitor',
				displayOptions: {
					show: {
						triggerType: ['dealStatusChanged'],
					},
				},
			},
			// Miner address for power trigger
			{
				displayName: 'Miner Address',
				name: 'minerAddress',
				type: 'string',
				default: '',
				required: true,
				description: 'Miner address to monitor',
				displayOptions: {
					show: {
						triggerType: ['minerPowerChanged'],
					},
				},
			},
			// Base fee threshold
			{
				displayName: 'Fee Change Threshold (%)',
				name: 'feeThreshold',
				type: 'number',
				default: 10,
				description: 'Percentage change in base fee to trigger',
				displayOptions: {
					show: {
						triggerType: ['baseFeeChanged'],
					},
				},
			},
			// Minimum balance change threshold
			{
				displayName: 'Minimum Change (FIL)',
				name: 'minChange',
				type: 'string',
				default: '0.001',
				description: 'Minimum balance change in FIL to trigger',
				displayOptions: {
					show: {
						triggerType: ['balanceChanged', 'filReceived'],
					},
				},
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const triggerType = this.getNodeParameter('triggerType') as string;
		const credentials = await this.getCredentials('filecoinNetwork');
		
		const lotus = createLotusClient({
			network: credentials.network as string,
			lotusRpcUrl: credentials.lotusRpcUrl as string,
			lotusApiToken: credentials.lotusApiToken as string,
		});

		const staticData = this.getWorkflowStaticData('node');
		const returnData: INodeExecutionData[] = [];

		try {
			switch (triggerType) {
				case 'newTipset': {
					const chainHead = await lotus.getChainHead();
					const currentHeight = chainHead.Height;
					const lastHeight = staticData.lastHeight as number | undefined;

					if (lastHeight === undefined || currentHeight > lastHeight) {
						staticData.lastHeight = currentHeight;

						// Only emit if not first run
						if (lastHeight !== undefined) {
							returnData.push({
								json: {
									triggerType: 'newTipset',
									height: currentHeight,
									previousHeight: lastHeight,
									blocksAdded: currentHeight - lastHeight,
									tipsetCids: chainHead.Cids?.map((c: { '/': string }) => c['/']),
									timestamp: new Date().toISOString(),
								},
							});
						}
					}
					break;
				}

				case 'balanceChanged': {
					const address = this.getNodeParameter('address') as string;
					const minChange = this.getNodeParameter('minChange') as string;

					if (!validateAddress(address)) {
						throw new Error(`Invalid address: ${address}`);
					}

					const currentBalance = await lotus.getWalletBalance(address);
					const lastBalance = staticData.lastBalance as string | undefined;

					if (lastBalance !== undefined) {
						const current = BigInt(currentBalance);
						const last = BigInt(lastBalance);
						const diff = current > last ? current - last : last - current;
						const minChangeAtto = BigInt(Math.floor(parseFloat(minChange) * 1e18));

						if (diff >= minChangeAtto) {
							returnData.push({
								json: {
									triggerType: 'balanceChanged',
									address,
									previousBalance: attoFilToFil(lastBalance),
									previousBalanceFormatted: `${formatFil(lastBalance)} FIL`,
									currentBalance: attoFilToFil(currentBalance),
									currentBalanceFormatted: `${formatFil(currentBalance)} FIL`,
									change: current > last ? 'increased' : 'decreased',
									changeAmount: attoFilToFil(diff.toString()),
									changeAmountFormatted: `${formatFil(diff.toString())} FIL`,
									timestamp: new Date().toISOString(),
								},
							});
						}
					}

					staticData.lastBalance = currentBalance;
					break;
				}

				case 'messageConfirmed': {
					const messageCid = this.getNodeParameter('messageCid') as string;
					const wasConfirmed = staticData.messageConfirmed as boolean | undefined;

					if (!wasConfirmed) {
						try {
							const receipt = await lotus.stateGetReceipt({ '/': messageCid }, []);

							if (receipt) {
								staticData.messageConfirmed = true;

								returnData.push({
									json: {
										triggerType: 'messageConfirmed',
										messageCid,
										exitCode: receipt.ExitCode,
										gasUsed: receipt.GasUsed,
										return: receipt.Return,
										success: receipt.ExitCode === 0,
										timestamp: new Date().toISOString(),
									},
								});
							}
						} catch {
							// Message not yet confirmed
						}
					}
					break;
				}

				case 'filReceived': {
					const address = this.getNodeParameter('address') as string;
					const minChange = this.getNodeParameter('minChange') as string;

					if (!validateAddress(address)) {
						throw new Error(`Invalid address: ${address}`);
					}

					const currentBalance = await lotus.getWalletBalance(address);
					const lastBalance = staticData.lastBalance as string | undefined;

					if (lastBalance !== undefined) {
						const current = BigInt(currentBalance);
						const last = BigInt(lastBalance);

						if (current > last) {
							const received = current - last;
							const minChangeAtto = BigInt(Math.floor(parseFloat(minChange) * 1e18));

							if (received >= minChangeAtto) {
								returnData.push({
									json: {
										triggerType: 'filReceived',
										address,
										previousBalance: attoFilToFil(lastBalance),
										currentBalance: attoFilToFil(currentBalance),
										received: attoFilToFil(received.toString()),
										receivedFormatted: `${formatFil(received.toString())} FIL`,
										timestamp: new Date().toISOString(),
									},
								});
							}
						}
					}

					staticData.lastBalance = currentBalance;
					break;
				}

				case 'dealStatusChanged': {
					const dealId = this.getNodeParameter('dealId') as number;
					const chainHead = await lotus.getChainHead();
					
					try {
						const deal = await lotus.stateMarketStorageDeal(dealId, chainHead.Cids);
						const lastState = staticData.lastDealState as number | undefined;

						if (deal && lastState !== undefined && deal.State?.SlashEpoch !== lastState) {
							returnData.push({
								json: {
									triggerType: 'dealStatusChanged',
									dealId,
									provider: deal.Proposal?.Provider,
									client: deal.Proposal?.Client,
									previousState: lastState,
									currentState: deal.State?.SlashEpoch,
									sectorStartEpoch: deal.State?.SectorStartEpoch,
									lastUpdatedEpoch: deal.State?.LastUpdatedEpoch,
									timestamp: new Date().toISOString(),
								},
							});
						}

						staticData.lastDealState = deal?.State?.SlashEpoch;
					} catch {
						// Deal not found
					}
					break;
				}

				case 'minerPowerChanged': {
					const minerAddress = this.getNodeParameter('minerAddress') as string;

					if (!validateAddress(minerAddress)) {
						throw new Error(`Invalid miner address: ${minerAddress}`);
					}

					const chainHead = await lotus.getChainHead();
					const power = await lotus.stateMinerPower(minerAddress, chainHead.Cids);
					const currentPower = power.MinerPower?.QualityAdjPower || '0';
					const lastPower = staticData.lastPower as string | undefined;

					if (lastPower !== undefined && currentPower !== lastPower) {
						const current = BigInt(currentPower);
						const last = BigInt(lastPower);

						returnData.push({
							json: {
								triggerType: 'minerPowerChanged',
								miner: minerAddress,
								previousPower: lastPower,
								currentPower,
								change: current > last ? 'increased' : 'decreased',
								hasMinPower: power.HasMinPower,
								timestamp: new Date().toISOString(),
							},
						});
					}

					staticData.lastPower = currentPower;
					break;
				}

				case 'baseFeeChanged': {
					const feeThreshold = this.getNodeParameter('feeThreshold') as number;
					const chainHead = await lotus.getChainHead();
					const currentBaseFee = chainHead.Blocks?.[0]?.ParentBaseFee || '0';
					const lastBaseFee = staticData.lastBaseFee as string | undefined;

					if (lastBaseFee !== undefined) {
						const current = BigInt(currentBaseFee);
						const last = BigInt(lastBaseFee);
						
						// Calculate percentage change
						const diff = current > last ? current - last : last - current;
						const percentChange = Number((diff * BigInt(100)) / last);

						if (percentChange >= feeThreshold) {
							returnData.push({
								json: {
									triggerType: 'baseFeeChanged',
									previousBaseFee: lastBaseFee,
									currentBaseFee,
									percentChange,
									direction: current > last ? 'increased' : 'decreased',
									height: chainHead.Height,
									timestamp: new Date().toISOString(),
								},
							});
						}
					}

					staticData.lastBaseFee = currentBaseFee;
					break;
				}

				default:
					throw new Error(`Unknown trigger type: ${triggerType}`);
			}
		} catch (error) {
			// Log error but don't fail the trigger
			console.error('Filecoin Trigger error:', error);
		}

		if (returnData.length === 0) {
			return null;
		}

		return [returnData];
	}
}
