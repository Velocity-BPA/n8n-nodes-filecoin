/**
 * Storage Provider Actions
 * Operations for Filecoin storage providers (miners)
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { attoFilToFil, formatFil } from '../../utils/unitConverter';
import { validateAddress } from '../../utils/addressUtils';

export const storageProviderProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['storageProvider'] } },
		options: [
			{ name: 'Get Provider Info', value: 'getProviderInfo', description: 'Get storage provider information', action: 'Get provider info' },
			{ name: 'List Providers', value: 'listProviders', description: 'List storage providers', action: 'List providers' },
			{ name: 'Get Provider Power', value: 'getProviderPower', description: 'Get provider power', action: 'Get provider power' },
			{ name: 'Get Provider Faults', value: 'getProviderFaults', description: 'Get provider faults', action: 'Get provider faults' },
			{ name: 'Get Provider Deadlines', value: 'getProviderDeadlines', description: 'Get provider deadlines', action: 'Get provider deadlines' },
			{ name: 'Get Provider Sectors', value: 'getProviderSectors', description: 'Get provider sectors', action: 'Get provider sectors' },
			{ name: 'Get Provider Balance', value: 'getProviderBalance', description: 'Get provider balance', action: 'Get provider balance' },
			{ name: 'Get Proving Deadline', value: 'getProvingDeadline', description: 'Get current proving deadline', action: 'Get proving deadline' },
		],
		default: 'getProviderInfo',
	},
	{
		displayName: 'Provider Address',
		name: 'providerAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Storage provider address (f0/t0)',
		displayOptions: { show: { resource: ['storageProvider'], operation: ['getProviderInfo', 'getProviderPower', 'getProviderFaults', 'getProviderDeadlines', 'getProviderSectors', 'getProviderBalance', 'getProvingDeadline'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 100,
		description: 'Maximum results to return',
		displayOptions: { show: { resource: ['storageProvider'], operation: ['listProviders', 'getProviderSectors'] } },
	},
];

export async function executeStorageProviderOperation(
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
		case 'getProviderInfo': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			const info = await lotus.stateMinerInfo(provider);
			
			result = {
				provider,
				owner: info.Owner,
				worker: info.Worker,
				newWorker: info.NewWorker,
				controlAddresses: info.ControlAddresses,
				peerId: info.PeerId,
				multiaddrs: info.Multiaddrs,
				windowPoStProofType: info.WindowPoStProofType,
				sectorSize: info.SectorSize,
				windowPoStPartitionSectors: info.WindowPoStPartitionSectors,
				consensusFaultElapsed: info.ConsensusFaultElapsed,
			};
			break;
		}
		
		case 'listProviders': {
			const limit = this.getNodeParameter('limit', index) as number;
			const miners = await lotus.stateListMiners();
			const limited = miners.slice(0, limit);
			
			const providersWithPower = await Promise.all(
				limited.map(async (miner: string) => {
					try {
						const power = await lotus.stateMinerPower(miner);
						return {
							address: miner,
							rawBytePower: power.MinerPower.RawBytePower,
							qualityAdjPower: power.MinerPower.QualityAdjPower,
							hasPower: power.HasMinPower,
						};
					} catch {
						return { address: miner, rawBytePower: '0', qualityAdjPower: '0', hasPower: false };
					}
				})
			);
			
			result = {
				providers: providersWithPower,
				count: providersWithPower.length,
				totalMiners: miners.length,
			};
			break;
		}
		
		case 'getProviderPower': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			const power = await lotus.stateMinerPower(provider);
			
			const rawBytes = BigInt(power.MinerPower.RawBytePower);
			const qaBytes = BigInt(power.MinerPower.QualityAdjPower);
			const totalRaw = BigInt(power.TotalPower.RawBytePower);
			const totalQA = BigInt(power.TotalPower.QualityAdjPower);
			
			result = {
				provider,
				minerPower: {
					rawBytePower: power.MinerPower.RawBytePower,
					rawBytePowerTiB: (Number(rawBytes) / (1024 ** 4)).toFixed(2),
					qualityAdjPower: power.MinerPower.QualityAdjPower,
					qualityAdjPowerTiB: (Number(qaBytes) / (1024 ** 4)).toFixed(2),
				},
				totalPower: {
					rawBytePower: power.TotalPower.RawBytePower,
					qualityAdjPower: power.TotalPower.QualityAdjPower,
				},
				hasMinPower: power.HasMinPower,
				shareOfNetwork: totalQA > 0 ? ((Number(qaBytes) / Number(totalQA)) * 100).toFixed(6) + '%' : '0%',
			};
			break;
		}
		
		case 'getProviderFaults': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			const faults = await lotus.stateMinerFaults(provider) as unknown[];
			const recoveries = await lotus.stateMinerRecoveries(provider) as unknown[];
			
			result = {
				provider,
				faults: faults,
				recoveries: recoveries,
				hasFaults: Array.isArray(faults) ? faults.length > 0 : Object.keys(faults || {}).length > 0,
				hasRecoveries: Array.isArray(recoveries) ? recoveries.length > 0 : Object.keys(recoveries || {}).length > 0,
			};
			break;
		}
		
		case 'getProviderDeadlines': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			const deadlines = await lotus.stateMinerDeadlines(provider) as { PostSubmissions: unknown; DisputableProofCount: number }[];
			
			result = {
				provider,
				deadlines: deadlines.map((dl, idx) => ({
					index: idx,
					postSubmissions: dl.PostSubmissions,
					disputableProofCount: dl.DisputableProofCount,
				})),
				totalDeadlines: deadlines.length,
			};
			break;
		}
		
		case 'getProviderSectors': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			const limit = this.getNodeParameter('limit', index) as number;
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			const sectors = await lotus.stateMinerSectors(provider) as { SectorNumber: number; SealProof: number; SealedCID: { '/': string }; DealIDs: number[]; Activation: number; Expiration: number }[] | null;
			const activeSectors = await lotus.stateMinerActiveSectors(provider) as unknown[] | null;
			
			const sectorList = (sectors || []).slice(0, limit).map((s) => ({
				sectorNumber: s.SectorNumber,
				sealProof: s.SealProof,
				sealedCid: s.SealedCID['/'],
				dealIds: s.DealIDs,
				activation: s.Activation,
				expiration: s.Expiration,
			}));
			
			result = {
				provider,
				sectors: sectorList,
				totalSectors: (sectors || []).length,
				activeSectorCount: (activeSectors || []).length,
			};
			break;
		}
		
		case 'getProviderBalance': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			const [available, marketBalance] = await Promise.all([
				lotus.stateMinerAvailableBalance(provider),
				lotus.stateMarketBalance(provider),
			]);
			
			result = {
				provider,
				availableBalance: available,
				availableBalanceFormatted: formatFil(available) + ' FIL',
				marketEscrow: marketBalance.Escrow,
				marketEscrowFormatted: formatFil(marketBalance.Escrow) + ' FIL',
				marketLocked: marketBalance.Locked,
				marketLockedFormatted: formatFil(marketBalance.Locked) + ' FIL',
			};
			break;
		}
		
		case 'getProvingDeadline': {
			const provider = this.getNodeParameter('providerAddress', index) as string;
			if (!validateAddress(provider)) throw new Error(`Invalid provider address: ${provider}`);
			
			interface DeadlineInfo {
				CurrentEpoch: number;
				PeriodStart: number;
				Index: number;
				Open: number;
				Close: number;
				Challenge: number;
				FaultCutoff: number;
				WPoStPeriodDeadlines: number;
				WPoStProvingPeriod: number;
				WPoStChallengeWindow: number;
				WPoStChallengeLookback: number;
				FaultDeclarationCutoff: number;
			}
			
			const deadline = await lotus.stateMinerProvingDeadline(provider) as DeadlineInfo;
			const head = await lotus.getChainHead();
			
			result = {
				provider,
				currentEpoch: deadline.CurrentEpoch,
				periodStart: deadline.PeriodStart,
				index: deadline.Index,
				open: deadline.Open,
				close: deadline.Close,
				challenge: deadline.Challenge,
				faultCutoff: deadline.FaultCutoff,
				wPoStPeriodDeadlines: deadline.WPoStPeriodDeadlines,
				wPoStProvingPeriod: deadline.WPoStProvingPeriod,
				wPoStChallengeWindow: deadline.WPoStChallengeWindow,
				wPoStChallengeLookback: deadline.WPoStChallengeLookback,
				faultDeclarationCutoff: deadline.FaultDeclarationCutoff,
				epochsUntilClose: deadline.Close - head.Height,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
