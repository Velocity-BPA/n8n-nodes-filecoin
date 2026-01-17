/**
 * Sector Actions
 * Operations for Filecoin sector management
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { validateAddress } from '../../utils/addressUtils';
import { epochToTimestamp } from '../../utils/unitConverter';

interface SectorInfo {
	SealedCID?: { '/': string };
	SectorKeyCID?: { '/': string } | null;
	Activation: number;
	Expiration: number;
	DealWeight: string;
	VerifiedDealWeight: string;
	InitialPledge: string;
	ExpectedDayReward: string;
	ExpectedStoragePledge: string;
}

interface ProvingDeadline {
	Index: number;
	PeriodStart: number;
	Open: number;
	Close: number;
	Challenge: number;
	FaultCutoff: number;
	WPoStPeriodDeadlines: number;
	WPoStProvingPeriod: number;
	WPoStChallengeWindow: number;
}

export const sectorProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['sector'],
			},
		},
		options: [
			{
				name: 'Get Sector Info',
				value: 'getInfo',
				description: 'Get information about a specific sector',
				action: 'Get sector info',
			},
			{
				name: 'List Sectors',
				value: 'listSectors',
				description: 'List all sectors for a provider',
				action: 'List sectors',
			},
			{
				name: 'Get Active Sectors',
				value: 'getActive',
				description: 'Get active sectors for a provider',
				action: 'Get active sectors',
			},
			{
				name: 'Get Sector Faults',
				value: 'getFaults',
				description: 'Get faulty sectors for a provider',
				action: 'Get sector faults',
			},
			{
				name: 'Get Sector Recoveries',
				value: 'getRecoveries',
				description: 'Get recovering sectors for a provider',
				action: 'Get sector recoveries',
			},
			{
				name: 'Get Sector Expiration',
				value: 'getExpiration',
				description: 'Get sector expiration info',
				action: 'Get sector expiration',
			},
			{
				name: 'Get Proving Deadlines',
				value: 'getDeadlines',
				description: 'Get proving deadlines for a provider',
				action: 'Get proving deadlines',
			},
			{
				name: 'Get Partition Info',
				value: 'getPartitions',
				description: 'Get partition information',
				action: 'Get partition info',
			},
		],
		default: 'getInfo',
	},
	{
		displayName: 'Provider Address',
		name: 'provider',
		type: 'string',
		default: '',
		required: true,
		description: 'Storage provider address (f0 format)',
		displayOptions: {
			show: {
				resource: ['sector'],
				operation: ['getInfo', 'listSectors', 'getActive', 'getFaults', 'getRecoveries', 'getDeadlines', 'getPartitions'],
			},
		},
	},
	{
		displayName: 'Sector Number',
		name: 'sectorNumber',
		type: 'number',
		default: 0,
		required: true,
		description: 'Sector number to query',
		displayOptions: {
			show: {
				resource: ['sector'],
				operation: ['getInfo', 'getExpiration'],
			},
		},
	},
	{
		displayName: 'Deadline Index',
		name: 'deadlineIndex',
		type: 'number',
		default: 0,
		description: 'Deadline index (0-47)',
		displayOptions: {
			show: {
				resource: ['sector'],
				operation: ['getPartitions'],
			},
		},
	},
];

export async function executeSectorOperation(
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
		case 'getInfo': {
			const provider = this.getNodeParameter('provider', index) as string;
			const sectorNumber = this.getNodeParameter('sectorNumber', index) as number;
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const sectorInfo = await lotus.getStateSectorGetInfo(provider, sectorNumber, chainHead.Cids) as SectorInfo | null;
			
			if (!sectorInfo) {
				throw new Error(`Sector ${sectorNumber} not found for provider ${provider}`);
			}
			
			result = {
				provider,
				sectorNumber,
				sealedCid: sectorInfo.SealedCID?.['/'],
				sectorType: sectorInfo.SectorKeyCID ? 'CC Upgraded' : 'Regular',
				activation: sectorInfo.Activation,
				activationTimestamp: epochToTimestamp(sectorInfo.Activation),
				expiration: sectorInfo.Expiration,
				expirationTimestamp: epochToTimestamp(sectorInfo.Expiration),
				dealWeight: sectorInfo.DealWeight,
				verifiedDealWeight: sectorInfo.VerifiedDealWeight,
				initialPledge: sectorInfo.InitialPledge,
				expectedDayReward: sectorInfo.ExpectedDayReward,
				expectedStoragePledge: sectorInfo.ExpectedStoragePledge,
			};
			break;
		}
		
		case 'listSectors': {
			const provider = this.getNodeParameter('provider', index) as string;
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const sectors = await lotus.getStateMinerSectors(provider, null, chainHead.Cids);
			
			result = {
				provider,
				sectors: sectors?.map((s: { SectorNumber: number; SealedCID: { '/': string }; Activation: number; Expiration: number }) => ({
					sectorNumber: s.SectorNumber,
					sealedCid: s.SealedCID?.['/'],
					activation: s.Activation,
					expiration: s.Expiration,
				})) || [],
				count: sectors?.length || 0,
			};
			break;
		}
		
		case 'getActive': {
			const provider = this.getNodeParameter('provider', index) as string;
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const activeSectors = await lotus.getStateMinerActiveSectors(provider, chainHead.Cids) as { SectorNumber: number; Expiration: number }[] | null;
			
			result = {
				provider,
				activeSectors: activeSectors?.map((s) => ({
					sectorNumber: s.SectorNumber,
					expiration: s.Expiration,
				})) || [],
				count: activeSectors?.length || 0,
			};
			break;
		}
		
		case 'getFaults': {
			const provider = this.getNodeParameter('provider', index) as string;
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const faults = await lotus.getStateMinerFaults(provider, chainHead.Cids) as number[] | null;
			
			result = {
				provider,
				faults,
				hasFaults: faults && faults.length > 0,
			};
			break;
		}
		
		case 'getRecoveries': {
			const provider = this.getNodeParameter('provider', index) as string;
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const recoveries = await lotus.getStateMinerRecoveries(provider, chainHead.Cids) as number[] | null;
			
			result = {
				provider,
				recoveries,
				hasRecoveries: recoveries && recoveries.length > 0,
			};
			break;
		}
		
		case 'getExpiration': {
			const provider = this.getNodeParameter('provider', index) as string;
			const sectorNumber = this.getNodeParameter('sectorNumber', index) as number;
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const sectorInfo = await lotus.getStateSectorGetInfo(provider, sectorNumber, chainHead.Cids) as SectorInfo | null;
			
			if (!sectorInfo) {
				throw new Error(`Sector ${sectorNumber} not found`);
			}
			
			const currentEpoch = chainHead.Height;
			const epochsRemaining = sectorInfo.Expiration - currentEpoch;
			const daysRemaining = (epochsRemaining * 30) / 86400; // ~30 seconds per epoch
			
			result = {
				provider,
				sectorNumber,
				expirationEpoch: sectorInfo.Expiration,
				expirationTimestamp: epochToTimestamp(sectorInfo.Expiration),
				currentEpoch,
				epochsRemaining,
				daysRemaining: Math.round(daysRemaining),
				isExpired: epochsRemaining <= 0,
			};
			break;
		}
		
		case 'getDeadlines': {
			const provider = this.getNodeParameter('provider', index) as string;
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const [deadlines, provingDeadline] = await Promise.all([
				lotus.getStateMinerDeadlines(provider, chainHead.Cids) as Promise<unknown[]>,
				lotus.getStateMinerProvingDeadline(provider, chainHead.Cids) as Promise<ProvingDeadline>,
			]);
			
			result = {
				provider,
				currentDeadline: provingDeadline.Index,
				periodStart: provingDeadline.PeriodStart,
				open: provingDeadline.Open,
				close: provingDeadline.Close,
				challenge: provingDeadline.Challenge,
				faultCutoff: provingDeadline.FaultCutoff,
				wpostPeriodDeadlines: provingDeadline.WPoStPeriodDeadlines,
				wpostProvingPeriod: provingDeadline.WPoStProvingPeriod,
				wpostChallengeWindow: provingDeadline.WPoStChallengeWindow,
				deadlines: deadlines?.length || 48,
			};
			break;
		}
		
		case 'getPartitions': {
			const provider = this.getNodeParameter('provider', index) as string;
			const deadlineIndex = this.getNodeParameter('deadlineIndex', index) as number;
			
			if (!validateAddress(provider)) {
				throw new Error(`Invalid provider address: ${provider}`);
			}
			
			if (deadlineIndex < 0 || deadlineIndex > 47) {
				throw new Error('Deadline index must be between 0 and 47');
			}
			
			const chainHead = await lotus.getChainHead();
			const partitions = await lotus.getStateMinerPartitions(provider, deadlineIndex, chainHead.Cids);
			
			result = {
				provider,
				deadlineIndex,
				partitions: partitions?.map((p: { AllSectors: unknown; FaultySectors: unknown; RecoveringSectors: unknown; LiveSectors: unknown; ActiveSectors: unknown }, i: number) => ({
					index: i,
					allSectors: p.AllSectors,
					faultySectors: p.FaultySectors,
					recoveringSectors: p.RecoveringSectors,
					liveSectors: p.LiveSectors,
					activeSectors: p.ActiveSectors,
				})) || [],
				count: partitions?.length || 0,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
