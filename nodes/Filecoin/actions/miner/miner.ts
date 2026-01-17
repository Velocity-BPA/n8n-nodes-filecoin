/**
 * Miner Actions
 * Operations for Filecoin miner/storage provider details
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { formatFil } from '../../utils/unitConverter';
import { validateAddress } from '../../utils/addressUtils';

export const minerProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['miner'] } },
		options: [
			{ name: 'Get Miner Info', value: 'getMinerInfo', description: 'Get miner information', action: 'Get miner info' },
			{ name: 'Get Miner Power', value: 'getMinerPower', description: 'Get miner power', action: 'Get miner power' },
			{ name: 'Get Available Balance', value: 'getAvailableBalance', description: 'Get available balance', action: 'Get available balance' },
			{ name: 'Get Miner Faults', value: 'getMinerFaults', description: 'Get miner faults', action: 'Get miner faults' },
			{ name: 'Get Miner Recoveries', value: 'getMinerRecoveries', description: 'Get miner recoveries', action: 'Get miner recoveries' },
			{ name: 'Get Pre-Commit Deposit', value: 'getPreCommitDeposit', description: 'Get pre-commit deposit for power', action: 'Get pre-commit deposit' },
			{ name: 'Get Initial Pledge', value: 'getInitialPledge', description: 'Get initial pledge collateral', action: 'Get initial pledge' },
			{ name: 'Get Deadlines', value: 'getDeadlines', description: 'Get proving deadlines', action: 'Get deadlines' },
			{ name: 'Get Partitions', value: 'getPartitions', description: 'Get deadline partitions', action: 'Get partitions' },
		],
		default: 'getMinerInfo',
	},
	{
		displayName: 'Miner Address',
		name: 'minerAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Miner address (f0/t0)',
		displayOptions: { show: { resource: ['miner'] } },
	},
	{
		displayName: 'Deadline Index',
		name: 'deadlineIndex',
		type: 'number',
		default: 0,
		description: 'Deadline index (0-47)',
		displayOptions: { show: { resource: ['miner'], operation: ['getPartitions'] } },
	},
	{
		displayName: 'Sector Size',
		name: 'sectorSize',
		type: 'options',
		options: [
			{ name: '32 GiB', value: 34359738368 },
			{ name: '64 GiB', value: 68719476736 },
		],
		default: 34359738368,
		description: 'Sector size for calculation',
		displayOptions: { show: { resource: ['miner'], operation: ['getPreCommitDeposit', 'getInitialPledge'] } },
	},
];

export async function executeMinerOperation(
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
	
	const miner = this.getNodeParameter('minerAddress', index) as string;
	if (!validateAddress(miner)) throw new Error(`Invalid miner address: ${miner}`);
	
	let result: unknown;
	
	switch (operation) {
		case 'getMinerInfo': {
			const info = await lotus.stateMinerInfo(miner);
			
			result = {
				miner,
				owner: info.Owner,
				worker: info.Worker,
				newWorker: info.NewWorker,
				controlAddresses: info.ControlAddresses,
				peerId: info.PeerId,
				multiaddrs: info.Multiaddrs,
				sectorSize: info.SectorSize,
				windowPoStProofType: info.WindowPoStProofType,
				windowPoStPartitionSectors: info.WindowPoStPartitionSectors,
			};
			break;
		}
		
		case 'getMinerPower': {
			const power = await lotus.stateMinerPower(miner);
			
			const rawBytes = BigInt(power.MinerPower.RawBytePower);
			const qaBytes = BigInt(power.MinerPower.QualityAdjPower);
			
			result = {
				miner,
				rawBytePower: power.MinerPower.RawBytePower,
				rawBytePowerTiB: (Number(rawBytes) / (1024 ** 4)).toFixed(2),
				qualityAdjPower: power.MinerPower.QualityAdjPower,
				qualityAdjPowerTiB: (Number(qaBytes) / (1024 ** 4)).toFixed(2),
				hasMinPower: power.HasMinPower,
				totalNetworkRawPower: power.TotalPower.RawBytePower,
				totalNetworkQAPower: power.TotalPower.QualityAdjPower,
			};
			break;
		}
		
		case 'getAvailableBalance': {
			const balance = await lotus.stateMinerAvailableBalance(miner);
			
			result = {
				miner,
				availableBalance: balance,
				availableBalanceFormatted: formatFil(balance) + ' FIL',
			};
			break;
		}
		
		case 'getMinerFaults': {
			const faults = await lotus.stateMinerFaults(miner);
			
			result = {
				miner,
				faults,
				hasFaults: Array.isArray(faults) ? faults.length > 0 : Object.keys(faults).length > 0,
			};
			break;
		}
		
		case 'getMinerRecoveries': {
			const recoveries = await lotus.stateMinerRecoveries(miner);
			
			result = {
				miner,
				recoveries,
				hasRecoveries: Array.isArray(recoveries) ? recoveries.length > 0 : Object.keys(recoveries).length > 0,
			};
			break;
		}
		
		case 'getPreCommitDeposit': {
			const sectorSize = this.getNodeParameter('sectorSize', index) as number;
			const deposit = await lotus.stateMinerPreCommitDepositForPower(miner, {
				SealProof: sectorSize === 34359738368 ? 8 : 9,
				SectorNumber: 0,
				SealedCID: { '/': 'baga6ea4seaqdsvqopmj2soyhujb72jza76t4wpq5fzifvm3ctz47iyytkewnubq' },
				SealRandEpoch: 0,
				DealIDs: [],
				Expiration: 0,
			}, []);
			
			result = {
				miner,
				sectorSize,
				preCommitDeposit: deposit,
				preCommitDepositFormatted: formatFil(deposit) + ' FIL',
			};
			break;
		}
		
		case 'getInitialPledge': {
			const sectorSize = this.getNodeParameter('sectorSize', index) as number;
			const pledge = await lotus.stateMinerInitialPledgeCollateral(miner, {
				SealProof: sectorSize === 34359738368 ? 8 : 9,
				SectorNumber: 0,
				SealedCID: { '/': 'baga6ea4seaqdsvqopmj2soyhujb72jza76t4wpq5fzifvm3ctz47iyytkewnubq' },
				SealRandEpoch: 0,
				DealIDs: [],
				Expiration: 0,
			}, []);
			
			result = {
				miner,
				sectorSize,
				initialPledge: pledge,
				initialPledgeFormatted: formatFil(pledge) + ' FIL',
			};
			break;
		}
		
		case 'getDeadlines': {
			const deadlines = await lotus.stateMinerDeadlines(miner);
			
			result = {
				miner,
				deadlines: deadlines.map((dl: { PostSubmissions: unknown; DisputableProofCount: number; LiveSectors: number; TotalSectors: number; FaultyPower: { Raw: string; QA: string } }, idx: number) => ({
					index: idx,
					postSubmissions: dl.PostSubmissions,
					disputableProofCount: dl.DisputableProofCount,
					liveSectors: dl.LiveSectors,
					totalSectors: dl.TotalSectors,
					faultyPower: dl.FaultyPower,
				})),
				totalDeadlines: deadlines.length,
			};
			break;
		}
		
		case 'getPartitions': {
			const deadlineIndex = this.getNodeParameter('deadlineIndex', index) as number;
			const partitions = await lotus.stateMinerPartitions(miner, deadlineIndex);
			
			result = {
				miner,
				deadlineIndex,
				partitions: (partitions || []).map((p: { AllSectors: unknown; FaultySectors: unknown; RecoveringSectors: unknown; LiveSectors: unknown; ActiveSectors: unknown }, idx: number) => ({
					index: idx,
					allSectors: p.AllSectors,
					faultySectors: p.FaultySectors,
					recoveringSectors: p.RecoveringSectors,
					liveSectors: p.LiveSectors,
					activeSectors: p.ActiveSectors,
				})),
				partitionCount: (partitions || []).length,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
