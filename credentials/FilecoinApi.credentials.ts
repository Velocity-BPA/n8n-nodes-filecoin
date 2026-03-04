import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class FilecoinApi implements ICredentialType {
	name = 'filecoinApi';
	displayName = 'Filecoin API';
	documentationUrl = 'https://docs.filecoin.io/developers/reference/json-rpc/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.node.glif.io/rpc/v0',
			required: true,
			placeholder: 'https://api.node.glif.io/rpc/v0',
			description: 'The base URL for the Filecoin RPC endpoint',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: false,
			description: 'API key for authentication (if required by your RPC provider)',
		},
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'None (Public Endpoint)',
					value: 'none',
				},
				{
					name: 'Bearer Token',
					value: 'bearer',
				},
				{
					name: 'Custom Header',
					value: 'header',
				},
			],
			default: 'none',
			description: 'Method to authenticate with the Filecoin RPC endpoint',
		},
		{
			displayName: 'Custom Header Name',
			name: 'headerName',
			type: 'string',
			default: 'X-API-Key',
			displayOptions: {
				show: {
					authMethod: ['header'],
				},
			},
			description: 'Name of the custom header for API key authentication',
		},
	];
}