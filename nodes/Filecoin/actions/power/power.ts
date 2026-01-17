/**
 * Power Actions
 * Operations for Filecoin network and miner power
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { createGlifApiClient } from '../../transport/glifApi';
import { validateAddress } from '../../utils/addressUtils';
import { formatBytes } from '../../utils/unitConverter';

export const powerProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['power'],
			},
		},
		options: [
			{
				name: 'Get Network Power',
				value: 'getNetworkPower',
				description: 'Get total network power',
				action: 'Get network power',
			},
			{
				name: 'Get Miner Power',
				value: 'getMinerPower',
				description: 'Get power for a specific miner',
				action: 'Get miner power',
			},
			{
				name: 'Get Power Table',
				value: 'getPowerTable',
				description: 'Get power table (top miners)',
				action: 'Get power table',
			},
			{
				name: 'Get Network Stats',
				value: 'getNetworkStats',
				description: 'Get network statistics',
				action: 'Get network stats',
			},
			{
				name: 'Get Miner Claim',
				value: 'getMinerClaim',
				description: 'Get power claim for a miner',
				action: 'Get miner claim',
			},
			{
				name: 'Compare Miners',
				value: 'compareMiners',
				description: 'Compare power between miners',
				action: 'Compare miners',
			},
		],
		default: 'getNetworkPower',
	},
	{
		displayName: 'Miner Address',
		name: 'miner',
		type: 'string',
		default: '',
		required: true,
		description: 'Miner address (f0 format)',
		displayOptions: {
			show: {
				resource: ['power'],
				operation: ['getMinerPower', 'getMinerClaim'],
			},
		},
	},
	{
		displayName: 'Miner Addresses',
		name: 'miners',
		type: 'string',
		default: '',
		required: true,
		description: 'Comma-separated miner addresses to compare',
		displayOptions: {
			show: {
				resource: ['power'],
				operation: ['compareMiners'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 20,
		description: 'Number of top miners to return',
		displayOptions: {
			show: {
				resource: ['power'],
				operation: ['getPowerTable'],
			},
		},
	},
];

export async function executePowerOperation(
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
	
	const glifApi = createGlifApiClient({
		network: credentials.network as string,
		glifApiUrl: credentials.glifApiUrl as string,
	});
	
	let result: unknown;
	
	switch (operation) {
		case 'getNetworkPower': {
			const chainHead = await lotus.getChainHead();
			const networkPower = await lotus.getStatePowerActor(chainHead.Cids);
			
			const totalRawPower = BigInt(networkPower?.State?.TotalRawBytePower || '0');
			const totalQAPower = BigInt(networkPower?.State?.TotalQualityAdjPower || '0');
			
			result = {
				totalRawBytePower: networkPower?.State?.TotalRawBytePower,
				totalRawBytePowerFormatted: formatBytes(totalRawPower),
				totalQualityAdjPower: networkPower?.State?.TotalQualityAdjPower,
				totalQualityAdjPowerFormatted: formatBytes(totalQAPower),
				totalPledgeCollateral: networkPower?.State?.TotalPledgeCollateral,
				minerCount: networkPower?.State?.MinerCount || 0,
				minerAboveMinPowerCount: networkPower?.State?.MinerAboveMinPowerCount || 0,
				chainHeight: chainHead.Height,
			};
			break;
		}
		
		case 'getMinerPower': {
			const miner = this.getNodeParameter('miner', index) as string;
			
			if (!validateAddress(miner)) {
				throw new Error(`Invalid miner address: ${miner}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const minerPower = await lotus.getStateMinerPower(miner, chainHead.Cids);
			
			const rawPower = BigInt(minerPower.MinerPower?.RawBytePower || '0');
			const qaPower = BigInt(minerPower.MinerPower?.QualityAdjPower || '0');
			const totalRaw = BigInt(minerPower.TotalPower?.RawBytePower || '1');
			const totalQA = BigInt(minerPower.TotalPower?.QualityAdjPower || '1');
			
			result = {
				miner,
				rawBytePower: minerPower.MinerPower?.RawBytePower,
				rawBytePowerFormatted: formatBytes(rawPower),
				qualityAdjPower: minerPower.MinerPower?.QualityAdjPower,
				qualityAdjPowerFormatted: formatBytes(qaPower),
				hasMinPower: minerPower.HasMinPower,
				networkShare: {
					rawPercent: Number((rawPower * BigInt(10000) / totalRaw)) / 100,
					qaPercent: Number((qaPower * BigInt(10000) / totalQA)) / 100,
				},
				networkTotal: {
					rawBytePower: minerPower.TotalPower?.RawBytePower,
					qualityAdjPower: minerPower.TotalPower?.QualityAdjPower,
				},
			};
			break;
		}
		
		case 'getPowerTable': {
			const limit = this.getNodeParameter('limit', index) as number;
			
			// Get top miners from Glif API
			const providers = await glifApi.getTopStorageProviders(limit);
			
			result = {
				topMiners: providers.map((p: any, i: number) => ({
					rank: i + 1,
					address: p.address,
					rawBytePower: p.rawBytePower,
					rawBytePowerFormatted: formatBytes(BigInt(p.rawBytePower || '0')),
					qualityAdjPower: p.qualityAdjPower,
					qualityAdjPowerFormatted: formatBytes(BigInt(p.qualityAdjPower || '0')),
					sectorCount: p.sectorCount,
				})),
				count: providers.length,
			};
			break;
		}
		
		case 'getNetworkStats': {
			const [chainHead, networkName, circSupply] = await Promise.all([
				lotus.getChainHead(),
				lotus.getStateNetworkName(),
				lotus.getStateCirculatingSupply([]),
			]);
			
			const networkPower = await lotus.getStatePowerActor(chainHead.Cids);
			
			result = {
				network: networkName,
				chainHeight: chainHead.Height,
				timestamp: new Date().toISOString(),
				power: {
					totalRawBytePower: networkPower?.State?.TotalRawBytePower,
					totalQualityAdjPower: networkPower?.State?.TotalQualityAdjPower,
					minerCount: networkPower?.State?.MinerCount,
					minerAboveMinPowerCount: networkPower?.State?.MinerAboveMinPowerCount,
				},
				supply: {
					filCirculating: circSupply.FilCirculating,
					filMined: circSupply.FilMined,
					filBurnt: circSupply.FilBurnt,
					filLocked: circSupply.FilLocked,
					filReserveDisbursed: circSupply.FilReserveDisbursed,
				},
			};
			break;
		}
		
		case 'getMinerClaim': {
			const miner = this.getNodeParameter('miner', index) as string;
			
			if (!validateAddress(miner)) {
				throw new Error(`Invalid miner address: ${miner}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const [minerPower, minerInfo] = await Promise.all([
				lotus.getStateMinerPower(miner, chainHead.Cids),
				lotus.getStateMinerInfo(miner, chainHead.Cids),
			]);
			
			result = {
				miner,
				claim: {
					rawBytePower: minerPower.MinerPower?.RawBytePower,
					qualityAdjPower: minerPower.MinerPower?.QualityAdjPower,
					hasMinPower: minerPower.HasMinPower,
				},
				info: {
					owner: minerInfo.Owner,
					worker: minerInfo.Worker,
					sectorSize: minerInfo.SectorSize,
					sectorSizeFormatted: formatBytes(BigInt(minerInfo.SectorSize || 0)),
					windowPoStProofType: minerInfo.WindowPoStProofType,
				},
			};
			break;
		}
		
		case 'compareMiners': {
			const minersStr = this.getNodeParameter('miners', index) as string;
			const minerAddresses = minersStr.split(',').map((m: string) => m.trim()).filter((m: string) => m);
			
			if (minerAddresses.length < 2) {
				throw new Error('Please provide at least 2 miner addresses to compare');
			}
			
			const chainHead = await lotus.getChainHead();
			
			const minerPowers = await Promise.all(
				minerAddresses.map(async (miner: string) => {
					if (!validateAddress(miner)) {
						return { miner, error: 'Invalid address' };
					}
					try {
						const power = await lotus.getStateMinerPower(miner, chainHead.Cids);
						const rawPower = BigInt(power.MinerPower?.RawBytePower || '0');
						const qaPower = BigInt(power.MinerPower?.QualityAdjPower || '0');
						return {
							miner,
							rawBytePower: power.MinerPower?.RawBytePower,
							rawBytePowerFormatted: formatBytes(rawPower),
							qualityAdjPower: power.MinerPower?.QualityAdjPower,
							qualityAdjPowerFormatted: formatBytes(qaPower),
							hasMinPower: power.HasMinPower,
						};
					} catch (error) {
						return { miner, error: 'Failed to fetch power' };
					}
				})
			);
			
			// Sort by QA power descending
			const sorted = minerPowers
				.filter((m: { error?: string }) => !m.error)
				.sort((a: { qualityAdjPower?: string }, b: { qualityAdjPower?: string }) => {
					const aQA = BigInt(a.qualityAdjPower || '0');
					const bQA = BigInt(b.qualityAdjPower || '0');
					return bQA > aQA ? 1 : bQA < aQA ? -1 : 0;
				});
			
			result = {
				comparison: sorted.map((m: { miner: string }, i: number) => ({ ...m, rank: i + 1 })),
				errors: minerPowers.filter((m: { error?: string }) => m.error),
				totalCompared: sorted.length,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
