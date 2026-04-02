import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FilecoinApi implements ICredentialType {
	name = 'filecoinApi';
	displayName = 'Filecoin API';
	documentationUrl = 'https://docs.filecoin.io/developers/reference/json-rpc/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key for authenticating with the Filecoin RPC provider',
		},
		{
			displayName: 'RPC Provider URL',
			name: 'baseUrl',
			type: 'options',
			options: [
				{
					name: 'Glif RPC',
					value: 'https://api.node.glif.io/rpc/v1',
				},
				{
					name: 'Ankr RPC',
					value: 'https://rpc.ankr.com/filecoin',
				},
				{
					name: 'ChainNodes RPC',
					value: 'https://filecoin-mainnet.chainnodes.org/v1',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
			default: 'https://api.node.glif.io/rpc/v1',
			description: 'The RPC provider endpoint to use',
		},
		{
			displayName: 'Custom URL',
			name: 'customUrl',
			type: 'string',
			displayOptions: {
				show: {
					baseUrl: ['custom'],
				},
			},
			default: '',
			placeholder: 'https://your-custom-rpc-endpoint.com',
			description: 'Custom RPC endpoint URL',
		},
	];
}