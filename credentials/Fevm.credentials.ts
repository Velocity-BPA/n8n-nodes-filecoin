import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * FEVM (Filecoin EVM) Credentials
 * For interacting with the Filecoin EVM runtime
 */
export class Fevm implements ICredentialType {
	name = 'fevm';
	displayName = 'Filecoin FEVM';
	documentationUrl = 'https://docs.filecoin.io/smart-contracts/fundamentals/the-fevm';

	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			options: [
				{
					name: 'Mainnet (Chain ID: 314)',
					value: 'mainnet',
				},
				{
					name: 'Calibration Testnet (Chain ID: 314159)',
					value: 'calibration',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
			default: 'mainnet',
			description: 'The FEVM network to connect to',
		},
		{
			displayName: 'FEVM RPC URL',
			name: 'fevmRpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.node.glif.io/rpc/v1',
			description: 'Custom FEVM RPC endpoint (required for custom network)',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Ethereum-format private key (0x... or hex string) for FEVM transactions',
			required: true,
		},
		{
			displayName: 'Chain ID',
			name: 'chainId',
			type: 'number',
			default: 314,
			description: 'Chain ID for the network (314 for mainnet, 314159 for calibration)',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Gas Price Strategy',
			name: 'gasPriceStrategy',
			type: 'options',
			options: [
				{
					name: 'Auto',
					value: 'auto',
				},
				{
					name: 'Manual',
					value: 'manual',
				},
			],
			default: 'auto',
			description: 'How to determine gas price for transactions',
		},
		{
			displayName: 'Max Gas Price (Gwei)',
			name: 'maxGasPrice',
			type: 'number',
			default: 100,
			description: 'Maximum gas price in Gwei for transactions',
			displayOptions: {
				show: {
					gasPriceStrategy: ['manual'],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.network === "custom" ? $credentials.fevmRpcUrl : ($credentials.network === "mainnet" ? "https://api.node.glif.io/rpc/v1" : "https://api.calibration.node.glif.io/rpc/v1")}}',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				jsonrpc: '2.0',
				method: 'eth_chainId',
				params: [],
				id: 1,
			},
		},
	};
}
