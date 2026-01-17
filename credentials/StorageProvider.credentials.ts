import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Storage Provider Credentials
 * For authenticating with specific Filecoin storage providers
 */
export class StorageProvider implements ICredentialType {
	name = 'storageProvider';
	displayName = 'Filecoin Storage Provider';
	documentationUrl = 'https://docs.filecoin.io/storage-providers';

	properties: INodeProperties[] = [
		{
			displayName: 'Storage Provider Endpoint',
			name: 'providerEndpoint',
			type: 'string',
			default: '',
			placeholder: 'https://provider.example.com',
			description: 'The storage provider API endpoint',
			required: true,
		},
		{
			displayName: 'Authentication Token',
			name: 'authToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Authentication token for the storage provider',
		},
		{
			displayName: 'Provider ID',
			name: 'providerId',
			type: 'string',
			default: '',
			placeholder: 'f01234',
			description: 'The storage provider ID (f0 address)',
			required: true,
		},
		{
			displayName: 'Boost Endpoint',
			name: 'boostEndpoint',
			type: 'string',
			default: '',
			placeholder: 'https://boost.provider.example.com',
			description: 'Boost market endpoint for deal making (optional)',
		},
		{
			displayName: 'Boost Auth Token',
			name: 'boostAuthToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Authentication token for Boost endpoint',
		},
	];
}
