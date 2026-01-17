/**
 * Glif API Client
 * Additional services from Glif for Filecoin data
 */

import axios, { AxiosInstance } from 'axios';
import { getNetworkConfig, NetworkType } from '../constants/networks';

/**
 * Glif API configuration
 */
export interface GlifApiConfig {
	network: NetworkType | 'custom';
	apiUrl?: string;
	timeout?: number;
}

/**
 * Account balance response
 */
export interface AccountBalance {
	address: string;
	balance: string;
	nonce: number;
}

/**
 * Actor state from Glif
 */
export interface GlifActorState {
	address: string;
	balance: string;
	code: string;
	nonce: number;
	state: unknown;
}

/**
 * Storage provider info
 */
export interface StorageProviderInfo {
	address: string;
	peerId: string;
	sectorSize: number;
	rawBytePower: string;
	qualityAdjPower: string;
	owner: string;
	worker: string;
	multiaddrs: string[];
}

/**
 * Deal info from Glif
 */
export interface GlifDealInfo {
	dealId: number;
	pieceCid: string;
	pieceSize: number;
	client: string;
	provider: string;
	startEpoch: number;
	endEpoch: number;
	storagePricePerEpoch: string;
	verified: boolean;
	label: string;
}

/**
 * Message info from Glif
 */
export interface GlifMessageInfo {
	cid: string;
	from: string;
	to: string;
	value: string;
	method: number;
	nonce: number;
	gasLimit: number;
	gasFeeCap: string;
	gasPremium: string;
	height: number;
	exitCode: number;
	gasUsed: number;
	return: string;
}

/**
 * Glif API Client
 */
export class GlifApiClient {
	private client: AxiosInstance;
	private config: GlifApiConfig;

	constructor(config: GlifApiConfig) {
		this.config = config;
		
		const networkConfig = getNetworkConfig(config.network);
		const baseURL = config.apiUrl || networkConfig.explorerApi;
		
		this.client = axios.create({
			baseURL,
			timeout: config.timeout || 30000,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	/**
	 * Make API request
	 */
	private async request<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
		const response = await this.client.get<T>(endpoint, { params });
		return response.data;
	}

	// ==================== Address Methods ====================

	/**
	 * Get address info
	 */
	async getAddressInfo(address: string): Promise<{
		address: string;
		id: string;
		robust: string[];
		actor: string;
		balance: string;
		messageCount: number;
		createHeight: number;
		createTimestamp: number;
	}> {
		return this.request(`/address/${address}`);
	}

	/**
	 * Get address balance
	 */
	async getAddressBalance(address: string): Promise<string> {
		const info = await this.getAddressInfo(address);
		return info.balance;
	}

	/**
	 * Get address messages
	 */
	async getAddressMessages(
		address: string,
		page: number = 0,
		pageSize: number = 20
	): Promise<{
		messages: GlifMessageInfo[];
		totalCount: number;
	}> {
		return this.request(`/address/${address}/messages`, { page, pageSize });
	}

	// ==================== Message Methods ====================

	/**
	 * Get message by CID
	 */
	async getMessage(cid: string): Promise<GlifMessageInfo> {
		return this.request(`/message/${cid}`);
	}

	/**
	 * Get recent messages
	 */
	async getRecentMessages(limit: number = 20): Promise<GlifMessageInfo[]> {
		return this.request('/messages', { limit });
	}

	// ==================== Storage Provider Methods ====================

	/**
	 * Get storage provider info
	 */
	async getStorageProvider(address: string): Promise<StorageProviderInfo> {
		return this.request(`/miner/${address}`);
	}

	/**
	 * Get storage provider list
	 */
	async getStorageProviders(
		page: number = 0,
		pageSize: number = 20,
		sortBy: 'power' | 'balance' = 'power'
	): Promise<{
		miners: StorageProviderInfo[];
		totalCount: number;
	}> {
		return this.request('/miners', { page, pageSize, sortBy });
	}

	/**
	 * Get top storage providers by power
	 */
	async getTopStorageProviders(limit: number = 10): Promise<StorageProviderInfo[]> {
		const result = await this.getStorageProviders(0, limit, 'power');
		return result.miners;
	}

	/**
	 * Get storage provider deals
	 */
	async getStorageProviderDeals(
		address: string,
		page: number = 0,
		pageSize: number = 20
	): Promise<{
		deals: GlifDealInfo[];
		totalCount: number;
	}> {
		return this.request(`/miner/${address}/deals`, { page, pageSize });
	}

	// ==================== Deal Methods ====================

	/**
	 * Get deal info
	 */
	async getDeal(dealId: number): Promise<GlifDealInfo> {
		return this.request(`/deal/${dealId}`);
	}

	/**
	 * Get deals by client
	 */
	async getDealsByClient(
		address: string,
		page: number = 0,
		pageSize: number = 20
	): Promise<{
		deals: GlifDealInfo[];
		totalCount: number;
	}> {
		return this.request(`/address/${address}/deals`, { page, pageSize });
	}

	/**
	 * Get recent deals
	 */
	async getRecentDeals(limit: number = 20): Promise<GlifDealInfo[]> {
		return this.request('/deals', { limit });
	}

	// ==================== Block/Tipset Methods ====================

	/**
	 * Get block by CID
	 */
	async getBlock(cid: string): Promise<{
		cid: string;
		miner: string;
		height: number;
		timestamp: number;
		parentWeight: string;
		messageCount: number;
	}> {
		return this.request(`/block/${cid}`);
	}

	/**
	 * Get tipset by height
	 */
	async getTipset(height: number): Promise<{
		height: number;
		timestamp: number;
		blocks: unknown[];
		baseFee: string;
	}> {
		return this.request(`/tipset/${height}`);
	}

	/**
	 * Get chain head
	 */
	async getChainHead(): Promise<{
		height: number;
		timestamp: number;
		baseFee: string;
	}> {
		return this.request('/chain/head');
	}

	// ==================== Network Stats ====================

	/**
	 * Get network stats
	 */
	async getNetworkStats(): Promise<{
		height: number;
		totalPower: string;
		activePower: string;
		totalMiners: number;
		activeMiners: number;
		baseFee: string;
		circulatingSupply: string;
		totalDeals: number;
		activeDeals: number;
	}> {
		return this.request('/stats');
	}

	/**
	 * Get gas stats
	 */
	async getGasStats(): Promise<{
		baseFee: string;
		avgGasUsed: number;
		avgGasPremium: string;
		avgGasFeeCap: string;
	}> {
		return this.request('/stats/gas');
	}

	/**
	 * Get power stats over time
	 */
	async getPowerHistory(days: number = 30): Promise<{
		date: string;
		totalPower: string;
		activePower: string;
	}[]> {
		return this.request('/stats/power/history', { days });
	}

	// ==================== Search ====================

	/**
	 * Search for addresses, messages, deals
	 */
	async search(query: string): Promise<{
		addresses: string[];
		messages: string[];
		deals: number[];
		blocks: string[];
	}> {
		return this.request('/search', { q: query });
	}
}

/**
 * Create Glif API client from n8n credentials
 */
export function createGlifClient(credentials: {
	network: string;
	glifApiUrl?: string;
}): GlifApiClient {
	return new GlifApiClient({
		network: credentials.network as NetworkType | 'custom',
		apiUrl: credentials.glifApiUrl,
	});
}

// Alias for backwards compatibility
export const createGlifApiClient = createGlifClient;
