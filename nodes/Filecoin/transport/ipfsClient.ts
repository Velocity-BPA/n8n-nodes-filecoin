/**
 * IPFS Client
 * Handle IPFS operations for Filecoin storage
 */

import axios, { AxiosInstance } from 'axios';

/**
 * IPFS client configuration
 */
export interface IpfsClientConfig {
	apiUrl: string;
	gatewayUrl?: string;
	timeout?: number;
	headers?: Record<string, string>;
}

/**
 * IPFS add result
 */
export interface IpfsAddResult {
	Name: string;
	Hash: string;
	Size: string;
}

/**
 * IPFS file stat
 */
export interface IpfsFileStat {
	Hash: string;
	Size: number;
	CumulativeSize: number;
	Blocks: number;
	Type: string;
}

/**
 * IPFS pin result
 */
export interface IpfsPinResult {
	Pins: string[];
}

/**
 * IPFS DAG node
 */
export interface IpfsDagNode {
	Data?: string;
	Links?: {
		Name: string;
		Hash: { '/': string };
		Size: number;
	}[];
}

/**
 * IPFS Client for file operations
 */
export class IpfsClient {
	private client: AxiosInstance;
	private config: IpfsClientConfig;
	private gatewayUrl: string;

	constructor(config: IpfsClientConfig) {
		this.config = config;
		this.gatewayUrl = config.gatewayUrl || 'https://dweb.link';
		
		this.client = axios.create({
			baseURL: config.apiUrl,
			timeout: config.timeout || 60000,
			headers: {
				...config.headers,
			},
		});
	}

	/**
	 * Add file to IPFS
	 */
	async add(content: Buffer | string, options?: {
		pin?: boolean;
		wrapWithDirectory?: boolean;
		filename?: string;
	}): Promise<IpfsAddResult> {
		const formData = new FormData();
		
		let blob: Blob;
		if (Buffer.isBuffer(content)) {
			blob = new Blob([content]);
		} else {
			blob = new Blob([content], { type: 'text/plain' });
		}
		
		formData.append('file', blob, options?.filename || 'file');
		
		const params = new URLSearchParams();
		if (options?.pin !== undefined) {
			params.set('pin', String(options.pin));
		}
		if (options?.wrapWithDirectory) {
			params.set('wrap-with-directory', 'true');
		}
		
		const response = await this.client.post<IpfsAddResult>(
			`/api/v0/add?${params.toString()}`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		
		return response.data;
	}

	/**
	 * Get file from IPFS
	 */
	async cat(cid: string): Promise<Buffer> {
		const response = await this.client.post(
			`/api/v0/cat?arg=${cid}`,
			null,
			{
				responseType: 'arraybuffer',
			}
		);
		
		return Buffer.from(response.data);
	}

	/**
	 * Get file from gateway
	 */
	async getFromGateway(cid: string): Promise<Buffer> {
		const response = await axios.get(`${this.gatewayUrl}/ipfs/${cid}`, {
			responseType: 'arraybuffer',
			timeout: this.config.timeout || 60000,
		});
		
		return Buffer.from(response.data);
	}

	/**
	 * Get file stat
	 */
	async stat(cid: string): Promise<IpfsFileStat> {
		const response = await this.client.post<IpfsFileStat>(
			`/api/v0/files/stat?arg=/ipfs/${cid}`
		);
		
		return response.data;
	}

	/**
	 * Pin a CID
	 */
	async pin(cid: string, recursive: boolean = true): Promise<IpfsPinResult> {
		const params = new URLSearchParams({
			arg: cid,
			recursive: String(recursive),
		});
		
		const response = await this.client.post<IpfsPinResult>(
			`/api/v0/pin/add?${params.toString()}`
		);
		
		return response.data;
	}

	/**
	 * Unpin a CID
	 */
	async unpin(cid: string, recursive: boolean = true): Promise<IpfsPinResult> {
		const params = new URLSearchParams({
			arg: cid,
			recursive: String(recursive),
		});
		
		const response = await this.client.post<IpfsPinResult>(
			`/api/v0/pin/rm?${params.toString()}`
		);
		
		return response.data;
	}

	/**
	 * List pinned CIDs
	 */
	async pinList(type: 'direct' | 'recursive' | 'indirect' | 'all' = 'all'): Promise<{
		Keys: { [cid: string]: { Type: string } };
	}> {
		const response = await this.client.post(
			`/api/v0/pin/ls?type=${type}`
		);
		
		return response.data;
	}

	/**
	 * Get DAG node
	 */
	async dagGet(cid: string): Promise<IpfsDagNode> {
		const response = await this.client.post<IpfsDagNode>(
			`/api/v0/dag/get?arg=${cid}`
		);
		
		return response.data;
	}

	/**
	 * Put DAG node
	 */
	async dagPut(data: unknown, options?: {
		format?: string;
		inputCodec?: string;
		pin?: boolean;
	}): Promise<{ Cid: { '/': string } }> {
		const formData = new FormData();
		formData.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
		
		const params = new URLSearchParams();
		if (options?.format) params.set('format', options.format);
		if (options?.inputCodec) params.set('input-codec', options.inputCodec);
		if (options?.pin !== undefined) params.set('pin', String(options.pin));
		
		const response = await this.client.post(
			`/api/v0/dag/put?${params.toString()}`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		
		return response.data;
	}

	/**
	 * Import CAR file
	 */
	async carImport(carData: Buffer): Promise<{
		Root: { Cid: { '/': string } };
	}> {
		const formData = new FormData();
		formData.append('file', new Blob([carData]));
		
		const response = await this.client.post(
			'/api/v0/dag/import',
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		
		return response.data;
	}

	/**
	 * Export to CAR file
	 */
	async carExport(cid: string): Promise<Buffer> {
		const response = await this.client.post(
			`/api/v0/dag/export?arg=${cid}`,
			null,
			{
				responseType: 'arraybuffer',
			}
		);
		
		return Buffer.from(response.data);
	}

	/**
	 * Get IPFS node ID
	 */
	async id(): Promise<{
		ID: string;
		PublicKey: string;
		Addresses: string[];
		AgentVersion: string;
		ProtocolVersion: string;
	}> {
		const response = await this.client.post('/api/v0/id');
		return response.data;
	}

	/**
	 * Get IPFS version
	 */
	async version(): Promise<{
		Version: string;
		Commit: string;
		Repo: string;
		System: string;
		Golang: string;
	}> {
		const response = await this.client.post('/api/v0/version');
		return response.data;
	}

	/**
	 * Get repo stats
	 */
	async repoStat(): Promise<{
		NumObjects: number;
		RepoPath: string;
		RepoSize: number;
		StorageMax: number;
		Version: string;
	}> {
		const response = await this.client.post('/api/v0/repo/stat');
		return response.data;
	}

	/**
	 * List directory contents
	 */
	async ls(cid: string): Promise<{
		Objects: {
			Hash: string;
			Links: {
				Name: string;
				Hash: string;
				Size: number;
				Type: number;
			}[];
		}[];
	}> {
		const response = await this.client.post(`/api/v0/ls?arg=${cid}`);
		return response.data;
	}

	/**
	 * Get gateway URL for a CID
	 */
	getGatewayUrl(cid: string, path?: string): string {
		const base = `${this.gatewayUrl}/ipfs/${cid}`;
		return path ? `${base}/${path}` : base;
	}

	/**
	 * Check if CID exists (by trying to stat it)
	 */
	async exists(cid: string): Promise<boolean> {
		try {
			await this.stat(cid);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * List pinned items
	 */
	async listPins(type: string = 'all'): Promise<{ Keys: Record<string, { Type: string }> }> {
		const response = await this.client.post('/api/v0/pin/ls', null, { params: { type } });
		return response.data;
	}

	/**
	 * Import CAR file
	 */
	async importCar(carData: Buffer | string): Promise<{ Root: { '/': string } }> {
		const FormData = (await import('form-data')).default;
		const form = new FormData();
		form.append('file', Buffer.isBuffer(carData) ? carData : Buffer.from(carData));
		
		return this.client.post('/dag/import', form, {
			headers: form.getHeaders(),
		}).then(res => res.data);
	}

	/**
	 * Export to CAR file
	 */
	async exportCar(cid: string): Promise<Buffer> {
		const response = await this.client.post('/dag/export', null, {
			params: { arg: cid },
			responseType: 'arraybuffer',
		});
		return Buffer.from(response.data);
	}

	/**
	 * Get IPFS repo stats
	 */
	async getStats(): Promise<{
		RepoSize: number;
		StorageMax: number;
		NumObjects: number;
		RepoPath: string;
		Version: string;
	}> {
		const response = await this.client.post('/api/v0/repo/stat');
		return response.data;
	}
}

/**
 * Default IPFS gateways
 */
export const IPFS_GATEWAYS = [
	'https://dweb.link',
	'https://ipfs.io',
	'https://cloudflare-ipfs.com',
	'https://gateway.pinata.cloud',
	'https://w3s.link',
] as const;

/**
 * Create IPFS client with default settings
 */
export function createIpfsClient(config: Partial<IpfsClientConfig> = {}): IpfsClient {
	return new IpfsClient({
		apiUrl: config.apiUrl || 'http://127.0.0.1:5001',
		gatewayUrl: config.gatewayUrl || 'https://dweb.link',
		timeout: config.timeout || 60000,
		...config,
	});
}
