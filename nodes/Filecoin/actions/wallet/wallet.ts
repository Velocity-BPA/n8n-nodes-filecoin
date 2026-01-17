/**
 * Wallet Actions
 * Operations for Filecoin wallet management
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { attoFilToFil, formatFil, filToAttoFil } from '../../utils/unitConverter';
import { validateAddress, getAddressTypeName } from '../../utils/addressUtils';

/**
 * Wallet resource properties for n8n UI
 */
export const walletProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['wallet'],
			},
		},
		options: [
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get FIL balance for an address',
				action: 'Get FIL balance',
			},
			{
				name: 'Get Address Info',
				value: 'getAddressInfo',
				description: 'Get information about an address',
				action: 'Get address info',
			},
			{
				name: 'Get Address ID',
				value: 'getAddressId',
				description: 'Get the ID address (f0) for a robust address',
				action: 'Get address ID',
			},
			{
				name: 'Create Wallet',
				value: 'createWallet',
				description: 'Create a new wallet',
				action: 'Create wallet',
			},
			{
				name: 'Export Private Key',
				value: 'exportPrivateKey',
				description: 'Export the private key for an address',
				action: 'Export private key',
			},
			{
				name: 'Import Private Key',
				value: 'importPrivateKey',
				description: 'Import a private key',
				action: 'Import private key',
			},
			{
				name: 'List Wallets',
				value: 'listWallets',
				description: 'List all wallets',
				action: 'List wallets',
			},
			{
				name: 'Get Default Wallet',
				value: 'getDefaultWallet',
				description: 'Get the default wallet address',
				action: 'Get default wallet',
			},
			{
				name: 'Set Default Wallet',
				value: 'setDefaultWallet',
				description: 'Set the default wallet address',
				action: 'Set default wallet',
			},
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign a message with a wallet',
				action: 'Sign message',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Validate a Filecoin address',
				action: 'Validate address',
			},
			{
				name: 'Get Address Type',
				value: 'getAddressType',
				description: 'Get the type of a Filecoin address',
				action: 'Get address type',
			},
			{
				name: 'Convert Address',
				value: 'convertAddress',
				description: 'Convert between ID and robust address',
				action: 'Convert address',
			},
		],
		default: 'getBalance',
	},
	// Address field for operations that need it
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Filecoin address (f0, f1, f2, f3, or f4 format)',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: [
					'getBalance',
					'getAddressInfo',
					'getAddressId',
					'exportPrivateKey',
					'setDefaultWallet',
					'signMessage',
					'validateAddress',
					'getAddressType',
					'convertAddress',
				],
			},
		},
	},
	// Key type for create wallet
	{
		displayName: 'Key Type',
		name: 'keyType',
		type: 'options',
		options: [
			{
				name: 'Secp256k1 (f1)',
				value: 'secp256k1',
			},
			{
				name: 'BLS (f3)',
				value: 'bls',
			},
		],
		default: 'secp256k1',
		description: 'Type of key to create',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['createWallet'],
			},
		},
	},
	// Private key for import
	{
		displayName: 'Private Key',
		name: 'privateKey',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		required: true,
		description: 'Private key to import',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['importPrivateKey'],
			},
		},
	},
	{
		displayName: 'Key Type',
		name: 'importKeyType',
		type: 'options',
		options: [
			{
				name: 'Secp256k1 (f1)',
				value: 'secp256k1',
			},
			{
				name: 'BLS (f3)',
				value: 'bls',
			},
		],
		default: 'secp256k1',
		description: 'Type of the private key',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['importPrivateKey'],
			},
		},
	},
	// Message to sign
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		default: '',
		required: true,
		description: 'Message data to sign (base64 encoded)',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['signMessage'],
			},
		},
	},
];

/**
 * Execute wallet operations
 */
export async function executeWalletOperation(
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
		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			
			if (!validateAddress(address)) {
				throw new Error(`Invalid Filecoin address: ${address}`);
			}
			
			const balanceAtto = await lotus.getWalletBalance(address);
			const balanceFil = attoFilToFil(balanceAtto);
			
			result = {
				address,
				balanceAttoFil: balanceAtto,
				balanceFil,
				balanceFormatted: `${formatFil(balanceAtto)} FIL`,
			};
			break;
		}
		
		case 'getAddressInfo': {
			const address = this.getNodeParameter('address', index) as string;
			
			if (!validateAddress(address)) {
				throw new Error(`Invalid Filecoin address: ${address}`);
			}
			
			const [actor, balance] = await Promise.all([
				lotus.getStateGetActor(address).catch(() => null),
				lotus.getWalletBalance(address).catch(() => '0'),
			]);
			
			result = {
				address,
				addressType: getAddressTypeName(address),
				balance: attoFilToFil(balance),
				balanceFormatted: `${formatFil(balance)} FIL`,
				nonce: actor?.Nonce || 0,
				actorCode: actor?.Code?.['/'] || null,
			};
			break;
		}
		
		case 'getAddressId': {
			const address = this.getNodeParameter('address', index) as string;
			
			if (!validateAddress(address)) {
				throw new Error(`Invalid Filecoin address: ${address}`);
			}
			
			const idAddress = await lotus.getStateLookupID(address);
			
			result = {
				address,
				idAddress,
			};
			break;
		}
		
		case 'createWallet': {
			const keyType = this.getNodeParameter('keyType', index) as 'secp256k1' | 'bls';
			const newAddress = await lotus.walletNew(keyType);
			
			result = {
				address: newAddress,
				keyType,
				addressType: keyType === 'secp256k1' ? 'f1' : 'f3',
			};
			break;
		}
		
		case 'exportPrivateKey': {
			const address = this.getNodeParameter('address', index) as string;
			
			if (!validateAddress(address)) {
				throw new Error(`Invalid Filecoin address: ${address}`);
			}
			
			const keyInfo = await lotus.walletExport(address);
			
			result = {
				address,
				keyType: keyInfo.Type,
				// Note: Be careful with private key exposure
				privateKey: keyInfo.PrivateKey,
			};
			break;
		}
		
		case 'importPrivateKey': {
			const privateKey = this.getNodeParameter('privateKey', index) as string;
			const keyType = this.getNodeParameter('importKeyType', index) as string;
			
			const address = await lotus.walletImport({
				Type: keyType,
				PrivateKey: privateKey,
			});
			
			result = {
				address,
				keyType,
				imported: true,
			};
			break;
		}
		
		case 'listWallets': {
			const addresses = await lotus.getWalletList();
			
			// Get balances for all wallets
			const walletsWithBalances = await Promise.all(
				addresses.map(async (addr) => {
					const balance = await lotus.getWalletBalance(addr).catch(() => '0');
					return {
						address: addr,
						addressType: getAddressTypeName(addr),
						balance: attoFilToFil(balance),
						balanceFormatted: `${formatFil(balance)} FIL`,
					};
				})
			);
			
			result = {
				wallets: walletsWithBalances,
				count: addresses.length,
			};
			break;
		}
		
		case 'getDefaultWallet': {
			const address = await lotus.getWalletDefaultAddress();
			const balance = await lotus.getWalletBalance(address);
			
			result = {
				address,
				addressType: getAddressTypeName(address),
				balance: attoFilToFil(balance),
				balanceFormatted: `${formatFil(balance)} FIL`,
			};
			break;
		}
		
		case 'setDefaultWallet': {
			const address = this.getNodeParameter('address', index) as string;
			
			if (!validateAddress(address)) {
				throw new Error(`Invalid Filecoin address: ${address}`);
			}
			
			await lotus.walletSetDefault(address);
			
			result = {
				address,
				setAsDefault: true,
			};
			break;
		}
		
		case 'signMessage': {
			const address = this.getNodeParameter('address', index) as string;
			const message = this.getNodeParameter('message', index) as string;
			
			if (!validateAddress(address)) {
				throw new Error(`Invalid Filecoin address: ${address}`);
			}
			
			const signature = await lotus.walletSign(address, message);
			
			result = {
				address,
				message,
				signature: signature.Data,
				signatureType: signature.Type,
			};
			break;
		}
		
		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const isValid = validateAddress(address);
			
			let validatedAddress: string | null = null;
			if (isValid) {
				try {
					validatedAddress = await lotus.walletValidateAddress(address);
				} catch {
					// Address format is valid but not on-chain
				}
			}
			
			result = {
				address,
				isValid,
				validatedAddress,
				addressType: isValid ? getAddressTypeName(address) : null,
			};
			break;
		}
		
		case 'getAddressType': {
			const address = this.getNodeParameter('address', index) as string;
			
			result = {
				address,
				addressType: getAddressTypeName(address),
				isValid: validateAddress(address),
				prefix: address.substring(0, 2),
			};
			break;
		}
		
		case 'convertAddress': {
			const address = this.getNodeParameter('address', index) as string;
			
			if (!validateAddress(address)) {
				throw new Error(`Invalid Filecoin address: ${address}`);
			}
			
			let idAddress: string | null = null;
			let robustAddress: string | null = null;
			
			// If it's an ID address, get the robust address
			if (address.match(/^[ft]0/)) {
				idAddress = address;
				try {
					robustAddress = await lotus.getStateAccountKey(address);
				} catch {
					robustAddress = null;
				}
			} else {
				// If it's a robust address, get the ID address
				robustAddress = address;
				try {
					idAddress = await lotus.getStateLookupID(address);
				} catch {
					idAddress = null;
				}
			}
			
			result = {
				originalAddress: address,
				idAddress,
				robustAddress,
				addressType: getAddressTypeName(address),
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
