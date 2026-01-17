/**
 * Utility Actions
 * Helper operations for Filecoin
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import {
	filToAttoFil,
	attoFilToFil,
	formatFil,
	convertFilUnits,
	formatBytes,
	parseBytes,
	epochToTimestamp,
	timestampToEpoch,
	FilDenomination,
} from '../../utils/unitConverter';
import {
	validateAddress,
	getAddressTypeName,
	isRobustAddress,
	ethAddressToFilecoin,
	filecoinToEthAddress,
	normalizeAddress,
	formatAddressShort,
} from '../../utils/addressUtils';
import {
	validateCid,
	getCidVersion,
	isPieceCid,
	formatCidShort,
	getCidExplorerLink,
	getIpfsGatewayLink,
	calculatePaddedPieceSize,
} from '../../utils/cidUtils';

export const utilityProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Convert Units',
				value: 'convertUnits',
				description: 'Convert between FIL denominations',
				action: 'Convert units',
			},
			{
				name: 'Validate CID',
				value: 'validateCid',
				description: 'Validate a Content Identifier',
				action: 'Validate CID',
			},
			{
				name: 'Format CID',
				value: 'formatCid',
				description: 'Format and get CID information',
				action: 'Format CID',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Validate a Filecoin address',
				action: 'Validate address',
			},
			{
				name: 'Convert Address',
				value: 'convertAddress',
				description: 'Convert between address formats',
				action: 'Convert address',
			},
			{
				name: 'Convert Epoch',
				value: 'convertEpoch',
				description: 'Convert between epoch and timestamp',
				action: 'Convert epoch',
			},
			{
				name: 'Format Bytes',
				value: 'formatBytes',
				description: 'Format byte sizes',
				action: 'Format bytes',
			},
			{
				name: 'Calculate Piece Size',
				value: 'calculatePieceSize',
				description: 'Calculate padded piece size for storage',
				action: 'Calculate piece size',
			},
			{
				name: 'Get Network Info',
				value: 'getNetworkInfo',
				description: 'Get current network information',
				action: 'Get network info',
			},
			{
				name: 'Get Version',
				value: 'getVersion',
				description: 'Get Lotus node version',
				action: 'Get version',
			},
			{
				name: 'Sign Data',
				value: 'signData',
				description: 'Sign arbitrary data',
				action: 'Sign data',
			},
			{
				name: 'Verify Signature',
				value: 'verifySignature',
				description: 'Verify a signature',
				action: 'Verify signature',
			},
		],
		default: 'convertUnits',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		default: '1',
		required: true,
		description: 'Amount to convert',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
	},
	{
		displayName: 'From Unit',
		name: 'fromUnit',
		type: 'options',
		options: [
			{ name: 'FIL', value: 'fil' },
			{ name: 'MilliFIL', value: 'millifil' },
			{ name: 'MicroFIL', value: 'microfil' },
			{ name: 'NanoFIL', value: 'nanofil' },
			{ name: 'PicoFIL', value: 'picofil' },
			{ name: 'FemtoFIL', value: 'femtofil' },
			{ name: 'AttoFIL', value: 'attofil' },
		],
		default: 'fil',
		description: 'Source unit',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
	},
	{
		displayName: 'To Unit',
		name: 'toUnit',
		type: 'options',
		options: [
			{ name: 'FIL', value: 'fil' },
			{ name: 'MilliFIL', value: 'millifil' },
			{ name: 'MicroFIL', value: 'microfil' },
			{ name: 'NanoFIL', value: 'nanofil' },
			{ name: 'PicoFIL', value: 'picofil' },
			{ name: 'FemtoFIL', value: 'femtofil' },
			{ name: 'AttoFIL', value: 'attofil' },
		],
		default: 'attofil',
		description: 'Target unit',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
	},
	{
		displayName: 'CID',
		name: 'cid',
		type: 'string',
		default: '',
		required: true,
		description: 'Content Identifier',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateCid', 'formatCid'],
			},
		},
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Filecoin or Ethereum address',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress', 'convertAddress'],
			},
		},
	},
	{
		displayName: 'Value',
		name: 'epochValue',
		type: 'string',
		default: '',
		required: true,
		description: 'Epoch number or timestamp to convert',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertEpoch'],
			},
		},
	},
	{
		displayName: 'Convert From',
		name: 'epochConvertFrom',
		type: 'options',
		options: [
			{ name: 'Epoch to Timestamp', value: 'epochToTimestamp' },
			{ name: 'Timestamp to Epoch', value: 'timestampToEpoch' },
		],
		default: 'epochToTimestamp',
		description: 'Conversion direction',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertEpoch'],
			},
		},
	},
	{
		displayName: 'Bytes',
		name: 'bytes',
		type: 'string',
		default: '',
		required: true,
		description: 'Byte size (number or formatted like "32 GiB")',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['formatBytes', 'calculatePieceSize'],
			},
		},
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '',
		required: true,
		description: 'Data to sign (base64 encoded)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['signData'],
			},
		},
	},
	{
		displayName: 'Signer Address',
		name: 'signerAddress',
		type: 'string',
		default: '',
		description: 'Address to sign with (uses default if empty)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['signData'],
			},
		},
	},
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		default: '',
		required: true,
		description: 'Signature to verify (base64 encoded)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['verifySignature'],
			},
		},
	},
	{
		displayName: 'Original Data',
		name: 'originalData',
		type: 'string',
		default: '',
		required: true,
		description: 'Original data that was signed (base64 encoded)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['verifySignature'],
			},
		},
	},
	{
		displayName: 'Signer Address',
		name: 'verifyAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Address of the signer',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['verifySignature'],
			},
		},
	},
];

export async function executeUtilityOperation(
	this: IExecuteFunctions,
	index: number
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('filecoinNetwork');
	
	let result: unknown;
	
	switch (operation) {
		case 'convertUnits': {
			const amount = this.getNodeParameter('amount', index) as string;
			const fromUnit = this.getNodeParameter('fromUnit', index) as FilDenomination;
			const toUnit = this.getNodeParameter('toUnit', index) as FilDenomination;
			
			const converted = convertFilUnits(amount, fromUnit, toUnit);
			
			result = {
				input: {
					amount,
					unit: fromUnit,
				},
				output: {
					amount: converted,
					unit: toUnit,
				},
				formatted: `${amount} ${fromUnit.toUpperCase()} = ${converted} ${toUnit.toUpperCase()}`,
			};
			break;
		}
		
		case 'validateCid': {
			const cid = this.getNodeParameter('cid', index) as string;
			
			const isValid = validateCid(cid);
			
			result = {
				cid,
				isValid,
				version: isValid ? getCidVersion(cid) : null,
				isPieceCid: isValid ? isPieceCid(cid) : null,
			};
			break;
		}
		
		case 'formatCid': {
			const cid = this.getNodeParameter('cid', index) as string;
			
			if (!validateCid(cid)) {
				throw new Error(`Invalid CID: ${cid}`);
			}
			
			result = {
				cid,
				short: formatCidShort(cid),
				version: getCidVersion(cid),
				isPieceCid: isPieceCid(cid),
				links: {
					explorer: getCidExplorerLink(cid, credentials.network as 'mainnet' | 'calibration'),
					ipfsGateway: getIpfsGatewayLink(cid),
					filGateway: `https://fil.storage/ipfs/${cid}`,
				},
			};
			break;
		}
		
		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			
			const isValid = validateAddress(address);
			const isEthAddress = address.startsWith('0x') && address.length === 42;
			
			result = {
				address,
				isValid,
				isEthAddress,
				type: isValid ? getAddressTypeName(address) : null,
				isRobust: isValid ? isRobustAddress(address) : null,
				normalized: isValid ? normalizeAddress(address) : null,
				short: isValid ? formatAddressShort(address) : null,
			};
			break;
		}
		
		case 'convertAddress': {
			const address = this.getNodeParameter('address', index) as string;
			
			const isEthAddress = address.startsWith('0x') && address.length === 42;
			
			let converted: { filecoin?: string; ethereum?: string; normalized?: string } = {};
			
			if (isEthAddress) {
				converted = {
					filecoin: ethAddressToFilecoin(address),
					ethereum: address.toLowerCase(),
				};
			} else if (validateAddress(address)) {
				const ethAddr = filecoinToEthAddress(address);
				converted = {
					filecoin: normalizeAddress(address),
					ethereum: ethAddr,
				};
			} else {
				throw new Error(`Invalid address: ${address}`);
			}
			
			result = {
				input: address,
				converted,
				type: isEthAddress ? 'Ethereum to Filecoin' : 'Filecoin to Ethereum',
			};
			break;
		}
		
		case 'convertEpoch': {
			const value = this.getNodeParameter('epochValue', index) as string;
			const convertFrom = this.getNodeParameter('epochConvertFrom', index) as string;
			
			if (convertFrom === 'epochToTimestamp') {
				const epoch = parseInt(value, 10);
				if (isNaN(epoch)) {
					throw new Error('Invalid epoch number');
				}
				
				const timestamp = epochToTimestamp(epoch);
				
				result = {
					epoch,
					timestamp,
					isoString: new Date(timestamp * 1000).toISOString(),
					humanReadable: new Date(timestamp * 1000).toString(),
				};
			} else {
				const timestamp = parseInt(value, 10);
				if (isNaN(timestamp)) {
					throw new Error('Invalid timestamp');
				}
				
				const epoch = timestampToEpoch(timestamp);
				
				result = {
					timestamp,
					epoch,
					isoString: new Date(timestamp * 1000).toISOString(),
				};
			}
			break;
		}
		
		case 'formatBytes': {
			const bytes = this.getNodeParameter('bytes', index) as string;
			
			// Check if it's already formatted
			let byteValue: bigint;
			if (/^\d+$/.test(bytes)) {
				byteValue = BigInt(bytes);
			} else {
				byteValue = parseBytes(bytes);
			}
			
			result = {
				input: bytes,
				bytes: byteValue.toString(),
				formatted: formatBytes(byteValue),
				units: {
					bytes: byteValue.toString(),
					kib: (byteValue / BigInt(1024)).toString(),
					mib: (byteValue / BigInt(1024 * 1024)).toString(),
					gib: (byteValue / BigInt(1024 * 1024 * 1024)).toString(),
					tib: (byteValue / BigInt(1024 * 1024 * 1024 * 1024)).toString(),
				},
			};
			break;
		}
		
		case 'calculatePieceSize': {
			const bytes = this.getNodeParameter('bytes', index) as string;
			
			let byteValue: bigint;
			if (/^\d+$/.test(bytes)) {
				byteValue = BigInt(bytes);
			} else {
				byteValue = parseBytes(bytes);
			}
			
			const paddedSize = calculatePaddedPieceSize(byteValue);
			
			result = {
				input: bytes,
				inputBytes: byteValue.toString(),
				inputFormatted: formatBytes(byteValue),
				paddedPieceSize: paddedSize.toString(),
				paddedPieceSizeFormatted: formatBytes(paddedSize),
				paddingOverhead: `${(Number((paddedSize - byteValue) * BigInt(100)) / Number(paddedSize)).toFixed(2)}%`,
				note: 'Filecoin requires data to be padded to power-of-2 piece sizes',
			};
			break;
		}
		
		case 'getNetworkInfo': {
			const lotus = createLotusClient({
				network: credentials.network as string,
				lotusRpcUrl: credentials.lotusRpcUrl as string,
				lotusApiToken: credentials.lotusApiToken as string,
			});
			
			const [chainHead, networkName, networkVersion] = await Promise.all([
				lotus.getChainHead(),
				lotus.getStateNetworkName(),
				lotus.getStateNetworkVersion([]),
			]);
			
			result = {
				network: networkName,
				networkVersion,
				chainHeight: chainHead.Height,
				timestamp: new Date().toISOString(),
				tipsetCids: chainHead.Cids?.map((c: { '/': string }) => c['/']) || [],
				rpcEndpoint: credentials.lotusRpcUrl,
			};
			break;
		}
		
		case 'getVersion': {
			const lotus = createLotusClient({
				network: credentials.network as string,
				lotusRpcUrl: credentials.lotusRpcUrl as string,
				lotusApiToken: credentials.lotusApiToken as string,
			});
			
			const version = await lotus.version();
			
			result = {
				version: version.Version,
				apiVersion: version.APIVersion,
				blockDelay: version.BlockDelay,
			};
			break;
		}
		
		case 'signData': {
			const data = this.getNodeParameter('data', index) as string;
			const signerAddress = this.getNodeParameter('signerAddress', index, '') as string;
			
			const lotus = createLotusClient({
				network: credentials.network as string,
				lotusRpcUrl: credentials.lotusRpcUrl as string,
				lotusApiToken: credentials.lotusApiToken as string,
			});
			
			const address = signerAddress || await lotus.getWalletDefaultAddress();
			
			if (!validateAddress(address)) {
				throw new Error(`Invalid signer address: ${address}`);
			}
			
			const signature = await lotus.walletSign(address, data);
			
			result = {
				signer: address,
				data,
				signature: signature.Data,
				signatureType: signature.Type,
			};
			break;
		}
		
		case 'verifySignature': {
			const signature = this.getNodeParameter('signature', index) as string;
			const originalData = this.getNodeParameter('originalData', index) as string;
			const verifyAddress = this.getNodeParameter('verifyAddress', index) as string;
			
			if (!validateAddress(verifyAddress)) {
				throw new Error(`Invalid address: ${verifyAddress}`);
			}
			
			const lotus = createLotusClient({
				network: credentials.network as string,
				lotusRpcUrl: credentials.lotusRpcUrl as string,
				lotusApiToken: credentials.lotusApiToken as string,
			});
			
			const isValid = await lotus.walletVerify(verifyAddress, originalData, {
				Type: 1, // secp256k1
				Data: signature,
			});
			
			result = {
				address: verifyAddress,
				data: originalData,
				signature,
				isValid,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
