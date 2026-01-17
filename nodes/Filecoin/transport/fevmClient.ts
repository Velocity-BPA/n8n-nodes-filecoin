/**
 * FEVM (Filecoin EVM) Client
 * Handles Ethereum-compatible operations on Filecoin
 */

import { ethers, JsonRpcProvider, Wallet, Contract, TransactionResponse, TransactionReceipt } from 'ethers';
import { getNetworkConfig, NetworkType } from '../constants/networks';

/**
 * FEVM client configuration
 */
export interface FevmClientConfig {
	network: NetworkType | 'custom';
	rpcUrl?: string;
	privateKey?: string;
	chainId?: number;
}

/**
 * Contract deployment result
 */
export interface DeploymentResult {
	contractAddress: string;
	transactionHash: string;
	blockNumber: number;
	gasUsed: bigint;
}

/**
 * Transaction options
 */
export interface TxOptions {
	gasLimit?: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	value?: bigint;
	nonce?: number;
}

/**
 * FEVM Client for Ethereum-compatible operations
 */
export class FevmClient {
	private provider: JsonRpcProvider;
	private wallet: Wallet | null = null;
	private config: FevmClientConfig;

	constructor(config: FevmClientConfig) {
		this.config = config;
		
		const networkConfig = getNetworkConfig(config.network, config.rpcUrl);
		const rpcUrl = config.rpcUrl || networkConfig.fevmRpc;
		const chainId = config.chainId || networkConfig.chainId;
		
		this.provider = new JsonRpcProvider(rpcUrl, {
			name: networkConfig.name,
			chainId,
		});
		
		if (config.privateKey) {
			// Remove 0x prefix if present for consistency
			const cleanKey = config.privateKey.startsWith('0x') 
				? config.privateKey 
				: `0x${config.privateKey}`;
			this.wallet = new Wallet(cleanKey, this.provider);
		}
	}

	/**
	 * Get the wallet address
	 */
	getAddress(): string | null {
		return this.wallet?.address || null;
	}

	/**
	 * Get the provider
	 */
	getProvider(): JsonRpcProvider {
		return this.provider;
	}

	/**
	 * Get wallet signer
	 */
	getSigner(): Wallet {
		if (!this.wallet) {
			throw new Error('No wallet configured. Private key required for signing.');
		}
		return this.wallet;
	}

	// ==================== Balance Methods ====================

	/**
	 * Get ETH/FIL balance
	 */
	async getBalance(address: string): Promise<bigint> {
		return this.provider.getBalance(address);
	}

	/**
	 * Get balance formatted in FIL/ETH
	 */
	async getBalanceFormatted(address: string, decimals: number = 4): Promise<string> {
		const balance = await this.getBalance(address);
		return ethers.formatEther(balance);
	}

	// ==================== Transaction Methods ====================

	/**
	 * Send ETH/FIL transaction
	 */
	async sendTransaction(
		to: string,
		amount: bigint,
		options?: TxOptions
	): Promise<TransactionResponse> {
		const signer = this.getSigner();
		
		const tx = await signer.sendTransaction({
			to,
			value: amount,
			...options,
		});
		
		return tx;
	}

	/**
	 * Wait for transaction confirmation
	 */
	async waitForTransaction(
		hash: string,
		confirmations: number = 1
	): Promise<TransactionReceipt | null> {
		return this.provider.waitForTransaction(hash, confirmations);
	}

	/**
	 * Get transaction by hash
	 */
	async getTransaction(hash: string): Promise<TransactionResponse | null> {
		return this.provider.getTransaction(hash);
	}

	/**
	 * Get transaction receipt
	 */
	async getTransactionReceipt(hash: string): Promise<TransactionReceipt | null> {
		return this.provider.getTransactionReceipt(hash);
	}

	/**
	 * Get pending nonce
	 */
	async getNonce(address?: string): Promise<number> {
		const addr = address || this.getAddress();
		if (!addr) throw new Error('No address provided');
		return this.provider.getTransactionCount(addr, 'pending');
	}

	// ==================== Contract Methods ====================

	/**
	 * Deploy a contract
	 */
	async deployContract(
		abi: ethers.InterfaceAbi,
		bytecode: string,
		constructorArgs: unknown[] = [],
		options?: TxOptions
	): Promise<DeploymentResult> {
		const signer = this.getSigner();
		
		const factory = new ethers.ContractFactory(abi, bytecode, signer);
		const contract = await factory.deploy(...constructorArgs, options || {});
		
		const deployTx = contract.deploymentTransaction();
		if (!deployTx) {
			throw new Error('Deployment transaction not found');
		}
		
		const receipt = await deployTx.wait();
		if (!receipt) {
			throw new Error('Deployment receipt not found');
		}
		
		const address = await contract.getAddress();
		
		return {
			contractAddress: address,
			transactionHash: deployTx.hash,
			blockNumber: receipt.blockNumber,
			gasUsed: receipt.gasUsed,
		};
	}

	/**
	 * Call a contract method (read-only)
	 */
	async callContract(
		contractAddress: string,
		abi: ethers.InterfaceAbi,
		method: string,
		args: unknown[] = []
	): Promise<unknown> {
		const contract = new Contract(contractAddress, abi, this.provider);
		return contract[method](...args);
	}

	/**
	 * Execute a contract method (write)
	 */
	async executeContract(
		contractAddress: string,
		abi: ethers.InterfaceAbi,
		method: string,
		args: unknown[] = [],
		options?: TxOptions
	): Promise<TransactionResponse> {
		const signer = this.getSigner();
		const contract = new Contract(contractAddress, abi, signer);
		
		return contract[method](...args, options || {});
	}

	/**
	 * Get contract code
	 */
	async getCode(address: string): Promise<string> {
		return this.provider.getCode(address);
	}

	/**
	 * Check if address is a contract
	 */
	async isContract(address: string): Promise<boolean> {
		const code = await this.getCode(address);
		return code !== '0x';
	}

	// ==================== Gas Methods ====================

	/**
	 * Estimate gas for a transaction
	 */
	async estimateGas(tx: {
		to?: string;
		from?: string;
		data?: string;
		value?: bigint;
	}): Promise<bigint> {
		return this.provider.estimateGas(tx);
	}

	/**
	 * Get current gas price
	 */
	async getGasPrice(): Promise<bigint> {
		const feeData = await this.provider.getFeeData();
		return feeData.gasPrice || 0n;
	}

	/**
	 * Get fee data (EIP-1559)
	 */
	async getFeeData(): Promise<{
		gasPrice: bigint | null;
		maxFeePerGas: bigint | null;
		maxPriorityFeePerGas: bigint | null;
	}> {
		return this.provider.getFeeData();
	}

	// ==================== Block Methods ====================

	/**
	 * Get block by number or hash
	 */
	async getBlock(blockTag: number | string): Promise<ethers.Block | null> {
		return this.provider.getBlock(blockTag);
	}

	/**
	 * Get block number
	 */
	async getBlockNumber(): Promise<number> {
		return this.provider.getBlockNumber();
	}

	/**
	 * Get block with transactions
	 */
	async getBlockWithTransactions(
		blockTag: number | string
	): Promise<ethers.Block | null> {
		return this.provider.getBlock(blockTag, true);
	}

	// ==================== Event/Log Methods ====================

	/**
	 * Get logs
	 */
	async getLogs(filter: ethers.Filter): Promise<ethers.Log[]> {
		return this.provider.getLogs(filter);
	}

	/**
	 * Get contract events
	 */
	async getContractEvents(
		contractAddress: string,
		abi: ethers.InterfaceAbi,
		eventName: string,
		fromBlock: number,
		toBlock: number | 'latest' = 'latest'
	): Promise<ethers.Log[]> {
		const contract = new Contract(contractAddress, abi, this.provider);
		const filter = contract.filters[eventName]();
		
		return this.provider.getLogs({
			...filter,
			fromBlock,
			toBlock,
		});
	}

	// ==================== Address Methods ====================

	/**
	 * Convert Filecoin f4 address to Ethereum address
	 */
	f4ToEthAddress(f4Address: string): string {
		// f410f prefix indicates EAM namespace
		if (!f4Address.match(/^[ft]410f[a-f0-9]{40}$/i)) {
			throw new Error('Invalid f4 address for EAM conversion');
		}
		return `0x${f4Address.slice(5)}`;
	}

	/**
	 * Convert Ethereum address to Filecoin f4 address
	 */
	ethToF4Address(ethAddress: string, testnet: boolean = false): string {
		if (!ethAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
			throw new Error('Invalid Ethereum address');
		}
		const prefix = testnet ? 't' : 'f';
		return `${prefix}410f${ethAddress.slice(2).toLowerCase()}`;
	}

	/**
	 * Resolve ENS name (not supported on Filecoin, but included for compatibility)
	 */
	async resolveName(name: string): Promise<string | null> {
		try {
			return await this.provider.resolveName(name);
		} catch {
			return null;
		}
	}

	// ==================== Utility Methods ====================

	/**
	 * Get network info
	 */
	async getNetwork(): Promise<ethers.Network> {
		return this.provider.getNetwork();
	}

	/**
	 * Get chain ID
	 */
	async getChainId(): Promise<bigint> {
		const network = await this.getNetwork();
		return network.chainId;
	}

	/**
	 * Sign message
	 */
	async signMessage(message: string): Promise<string> {
		const signer = this.getSigner();
		return signer.signMessage(message);
	}

	/**
	 * Sign typed data (EIP-712)
	 */
	async signTypedData(
		domain: ethers.TypedDataDomain,
		types: Record<string, ethers.TypedDataField[]>,
		value: Record<string, unknown>
	): Promise<string> {
		const signer = this.getSigner();
		return signer.signTypedData(domain, types, value);
	}

	/**
	 * Verify message signature
	 */
	verifyMessage(message: string, signature: string): string {
		return ethers.verifyMessage(message, signature);
	}

	/**
	 * Parse units (e.g., "1.5" -> wei)
	 */
	parseUnits(value: string, decimals: number = 18): bigint {
		return ethers.parseUnits(value, decimals);
	}

	/**
	 * Format units (e.g., wei -> "1.5")
	 */
	formatUnits(value: bigint, decimals: number = 18): string {
		return ethers.formatUnits(value, decimals);
	}
}

/**
 * Create FEVM client from n8n credentials
 */
export function createFevmClient(credentials: {
	network: string;
	fevmRpcUrl?: string;
	privateKey?: string;
	chainId?: number;
}): FevmClient {
	return new FevmClient({
		network: credentials.network as NetworkType | 'custom',
		rpcUrl: credentials.fevmRpcUrl,
		privateKey: credentials.privateKey,
		chainId: credentials.chainId,
	});
}
