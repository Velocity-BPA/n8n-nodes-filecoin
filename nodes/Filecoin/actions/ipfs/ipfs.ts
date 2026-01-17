/**
 * IPFS Actions
 * Operations for IPFS file storage integration
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createIpfsClient } from '../../transport/ipfsClient';
import { formatBytes } from '../../utils/unitConverter';
import { getIpfsGatewayLink } from '../../utils/cidUtils';

export const ipfsProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ipfs'],
			},
		},
		options: [
			{
				name: 'Add File',
				value: 'addFile',
				description: 'Add a file to IPFS',
				action: 'Add file to IPFS',
			},
			{
				name: 'Get File',
				value: 'getFile',
				description: 'Get a file from IPFS by CID',
				action: 'Get file from IPFS',
			},
			{
				name: 'Pin File',
				value: 'pinFile',
				description: 'Pin a CID to IPFS',
				action: 'Pin file',
			},
			{
				name: 'Unpin File',
				value: 'unpinFile',
				description: 'Unpin a CID from IPFS',
				action: 'Unpin file',
			},
			{
				name: 'Get File Info',
				value: 'getFileInfo',
				description: 'Get information about a file',
				action: 'Get file info',
			},
			{
				name: 'List Pins',
				value: 'listPins',
				description: 'List all pinned items',
				action: 'List pins',
			},
		],
		default: 'addFile',
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		required: true,
		description: 'Content to add to IPFS',
		displayOptions: {
			show: {
				resource: ['ipfs'],
				operation: ['addFile'],
			},
		},
	},
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		options: [
			{ name: 'Text', value: 'text' },
			{ name: 'JSON', value: 'json' },
			{ name: 'Base64', value: 'base64' },
		],
		default: 'text',
		description: 'Type of content being added',
		displayOptions: {
			show: {
				resource: ['ipfs'],
				operation: ['addFile'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		description: 'Optional filename for the content',
		displayOptions: {
			show: {
				resource: ['ipfs'],
				operation: ['addFile'],
			},
		},
	},
	{
		displayName: 'CID',
		name: 'cid',
		type: 'string',
		default: '',
		required: true,
		description: 'Content Identifier (CID) of the file',
		displayOptions: {
			show: {
				resource: ['ipfs'],
				operation: ['getFile', 'pinFile', 'unpinFile', 'getFileInfo'],
			},
		},
	},
];

export async function executeIpfsOperation(
	this: IExecuteFunctions,
	index: number
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	
	const ipfs = createIpfsClient({
		apiUrl: 'http://127.0.0.1:5001',
		gatewayUrl: 'https://dweb.link',
	});
	
	let result: any;
	
	switch (operation) {
		case 'addFile': {
			const content = this.getNodeParameter('content', index) as string;
			const contentType = this.getNodeParameter('contentType', index) as string;
			const fileName = this.getNodeParameter('fileName', index, '') as string;
			
			let data: Buffer;
			
			switch (contentType) {
				case 'json':
					try {
						JSON.parse(content);
						data = Buffer.from(content);
					} catch {
						throw new Error('Invalid JSON content');
					}
					break;
				case 'base64':
					data = Buffer.from(content, 'base64');
					break;
				default:
					data = Buffer.from(content);
			}
			
			const addResult = await ipfs.add(data, { filename: fileName || undefined });
			
			result = {
				cid: addResult.Hash,
				name: addResult.Name,
				size: addResult.Size,
				sizeFormatted: formatBytes(BigInt(addResult.Size || 0)),
				fileName: fileName || null,
				gatewayUrl: getIpfsGatewayLink(addResult.Hash),
				dwebUrl: `https://dweb.link/ipfs/${addResult.Hash}`,
			};
			break;
		}
		
		case 'getFile': {
			const cid = this.getNodeParameter('cid', index) as string;
			const content = await ipfs.cat(cid);
			
			result = {
				cid,
				content: content.toString('utf8'),
				contentBase64: content.toString('base64'),
				size: content.length,
				sizeFormatted: formatBytes(BigInt(content.length)),
			};
			break;
		}
		
		case 'pinFile': {
			const cid = this.getNodeParameter('cid', index) as string;
			const pinResult = await ipfs.pin(cid);
			
			result = {
				cid,
				pinned: true,
				pins: pinResult.Pins,
			};
			break;
		}
		
		case 'unpinFile': {
			const cid = this.getNodeParameter('cid', index) as string;
			await ipfs.unpin(cid);
			
			result = {
				cid,
				unpinned: true,
			};
			break;
		}
		
		case 'getFileInfo': {
			const cid = this.getNodeParameter('cid', index) as string;
			const stat = await ipfs.stat(cid);
			
			result = {
				cid,
				hash: stat.Hash,
				size: stat.Size,
				sizeFormatted: formatBytes(BigInt(stat.Size)),
				cumulativeSize: stat.CumulativeSize,
				blocks: stat.Blocks,
				type: stat.Type,
			};
			break;
		}
		
		case 'listPins': {
			const pins = await ipfs.listPins();
			const pinList = Object.entries(pins.Keys || {}).map(([cid, info]: [string, any]) => ({
				cid,
				type: info.Type,
			}));
			
			result = {
				pins: pinList,
				count: pinList.length,
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}
