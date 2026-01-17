import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Filecoin Network Credentials
 * Supports Mainnet, Calibration Testnet, Hyperspace Testnet, and Custom endpoints
 */
export class FilecoinNetwork implements ICredentialType {
	name = 'filecoinNetwork';
	displayName = 'Filecoin Network';
	documentationUrl = 'https://docs.filecoin.io/';

	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			options: [
				{
					name: 'Mainnet',
					value: 'mainnet',
				},
				{
					name: 'Calibration Testnet',
					value: 'calibration',
				},
				{
					name: 'Hyperspace Testnet',
					value: 'hyperspace',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
			default: 'mainnet',
			description: 'The Filecoin network to connect to',
		},
		{
			displayName: 'Lotus RPC Endpoint',
			name: 'lotusRpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.node.glif.io/rpc/v1',
			description: 'The Lotus RPC endpoint URL. Leave empty for default network endpoints.',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Lotus API Token',
			name: 'lotusApiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API token for authenticated Lotus endpoints (optional for public endpoints)',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Private key for signing transactions (secp256k1 or BLS format)',
		},
		{
			displayName: 'Address Type',
			name: 'addressType',
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
			description: 'The type of address/key being used',
		},
		{
			displayName: 'Glif API Endpoint',
			name: 'glifApiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.node.glif.io',
			description: 'Optional Glif API endpoint for additional services',
		},
		{
			displayName: 'FEVM RPC URL',
			name: 'fevmRpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.node.glif.io/rpc/v1',
			description: 'Filecoin EVM RPC URL for FEVM operations',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.lotusApiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.network === "custom" ? $credentials.lotusRpcUrl : ($credentials.network === "mainnet" ? "https://api.node.glif.io/rpc/v1" : ($credentials.network === "calibration" ? "https://api.calibration.node.glif.io/rpc/v1" : "https://api.hyperspace.node.glif.io/rpc/v1"))}}',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				jsonrpc: '2.0',
				method: 'Filecoin.Version',
				params: [],
				id: 1,
			},
		},
	};
}
