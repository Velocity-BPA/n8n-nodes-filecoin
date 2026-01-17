/**
 * Lotus RPC Client
 * Handles communication with Filecoin Lotus nodes via JSON-RPC
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getNetworkConfig, NetworkType } from '../constants/networks';

/**
 * Lotus RPC response structure
 */
export interface LotusResponse<T> {
	jsonrpc: string;
	id: number;
	result?: T;
	error?: {
		code: number;
		message: string;
		data?: unknown;
	};
}

/**
 * Lotus client configuration
 */
export interface LotusClientConfig {
	network: NetworkType | 'custom';
	rpcUrl?: string;
	apiToken?: string;
	timeout?: number;
}

/**
 * Message structure for Filecoin transactions
 */
export interface FilecoinMessage {
	Version: number;
	To: string;
	From: string;
	Nonce: number;
	Value: string;
	GasLimit: number;
	GasFeeCap: string;
	GasPremium: string;
	Method: number;
	Params: string;
}

/**
 * Signed message structure
 */
export interface SignedMessage {
	Message: FilecoinMessage;
	Signature: {
		Type: number;
		Data: string;
	};
	CID?: { '/': string };
}

/**
 * Tipset structure
 */
export interface Tipset {
	Cids: { '/': string }[];
	Blocks: Block[];
	Height: number;
}

/**
 * Block structure
 */
export interface Block {
	Miner: string;
	Ticket: {
		VRFProof: string;
	};
	ElectionProof: {
		WinCount: number;
		VRFProof: string;
	};
	BeaconEntries: unknown[];
	WinPoStProof: unknown[];
	Parents: { '/': string }[];
	ParentWeight: string;
	Height: number;
	ParentStateRoot: { '/': string };
	ParentMessageReceipts: { '/': string };
	Messages: { '/': string };
	BLSAggregate: {
		Type: number;
		Data: string;
	};
	Timestamp: number;
	BlockSig: {
		Type: number;
		Data: string;
	};
	ForkSignaling: number;
	ParentBaseFee: string;
}

/**
 * Message receipt structure
 */
export interface MessageReceipt {
	ExitCode: number;
	Return: string;
	GasUsed: number;
}

/**
 * Message lookup result
 */
export interface MessageLookup {
	Message: { '/': string };
	Receipt: MessageReceipt;
	ReturnDec: unknown;
	TipSet: { '/': string }[];
	Height: number;
}

/**
 * Actor state structure
 */
export interface ActorState {
	Code: { '/': string };
	Head: { '/': string };
	Nonce: number;
	Balance: string;
}

/**
 * Miner info structure
 */
export interface MinerInfo {
	Owner: string;
	Worker: string;
	NewWorker: string;
	ControlAddresses: string[];
	WorkerChangeEpoch: number;
	PeerId: string;
	Multiaddrs: string[];
	WindowPoStProofType: number;
	SectorSize: number;
	WindowPoStPartitionSectors: number;
	ConsensusFaultElapsed: number;
}

/**
 * Miner power structure
 */
export interface MinerPower {
	MinerPower: {
		RawBytePower: string;
		QualityAdjPower: string;
	};
	TotalPower: {
		RawBytePower: string;
		QualityAdjPower: string;
	};
	HasMinPower: boolean;
}

/**
 * Storage deal structure
 */
export interface StorageDeal {
	Proposal: {
		PieceCID: { '/': string };
		PieceSize: number;
		VerifiedDeal: boolean;
		Client: string;
		Provider: string;
		Label: string;
		StartEpoch: number;
		EndEpoch: number;
		StoragePricePerEpoch: string;
		ProviderCollateral: string;
		ClientCollateral: string;
	};
	State: {
		SectorStartEpoch: number;
		LastUpdatedEpoch: number;
		SlashEpoch: number;
	};
}

/**
 * Gas estimate result
 */
export interface GasEstimate {
	GasLimit: number;
	GasFeeCap: string;
	GasPremium: string;
}

/**
 * Lotus RPC Client
 */
export class LotusClient {
	private client: AxiosInstance;
	private requestId: number = 0;
	private config: LotusClientConfig;

	constructor(config: LotusClientConfig) {
		this.config = config;
		
		const networkConfig = getNetworkConfig(config.network, config.rpcUrl);
		const baseURL = config.rpcUrl || networkConfig.lotusRpc;
		
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};
		
		if (config.apiToken) {
			headers['Authorization'] = `Bearer ${config.apiToken}`;
		}
		
		this.client = axios.create({
			baseURL,
			headers,
			timeout: config.timeout || 30000,
		});
	}

	/**
	 * Make a JSON-RPC call to Lotus
	 */
	async call<T>(method: string, params: unknown[] = []): Promise<T> {
		const id = ++this.requestId;
		
		try {
			const response = await this.client.post<LotusResponse<T>>('', {
				jsonrpc: '2.0',
				method: `Filecoin.${method}`,
				params,
				id,
			});
			
			if (response.data.error) {
				throw new Error(`Lotus RPC Error: ${response.data.error.message}`);
			}
			
			return response.data.result as T;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError<LotusResponse<T>>;
				if (axiosError.response?.data?.error) {
					throw new Error(`Lotus RPC Error: ${axiosError.response.data.error.message}`);
				}
				throw new Error(`Lotus connection error: ${axiosError.message}`);
			}
			throw error;
		}
	}

	// ==================== Chain Methods ====================

	async getChainHead(): Promise<Tipset> {
		return this.call<Tipset>('ChainHead');
	}

	async getChainGetTipSetByHeight(height: number, tsk?: { '/': string }[]): Promise<Tipset> {
		return this.call<Tipset>('ChainGetTipSetByHeight', [height, tsk || null]);
	}

	async getChainGetBlock(cid: { '/': string }): Promise<Block> {
		return this.call<Block>('ChainGetBlock', [cid]);
	}

	async getChainGetBlockMessages(cid: { '/': string }): Promise<{ BlsMessages: FilecoinMessage[]; SecpkMessages: SignedMessage[] }> {
		return this.call('ChainGetBlockMessages', [cid]);
	}

	async getChainGetMessage(cid: { '/': string }): Promise<FilecoinMessage> {
		return this.call<FilecoinMessage>('ChainGetMessage', [cid]);
	}

	async getChainGetGenesis(): Promise<Tipset> {
		return this.call<Tipset>('ChainGetGenesis');
	}

	// ==================== State Methods ====================

	async getStateGetActor(address: string, tsk?: { '/': string }[]): Promise<ActorState> {
		return this.call<ActorState>('StateGetActor', [address, tsk || null]);
	}

	async getStateAccountKey(address: string, tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('StateAccountKey', [address, tsk || null]);
	}

	async getStateLookupID(address: string, tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('StateLookupID', [address, tsk || null]);
	}

	async getStateListActors(tsk?: { '/': string }[]): Promise<string[]> {
		return this.call<string[]>('StateListActors', [tsk || null]);
	}

	async getStateReadState(address: string, tsk?: { '/': string }[]): Promise<{ Balance: string; Code: { '/': string }; State: unknown }> {
		return this.call('StateReadState', [address, tsk || null]);
	}

	async getStateNetworkName(): Promise<string> {
		return this.call<string>('StateNetworkName');
	}

	async getStateNetworkVersion(tsk?: { '/': string }[]): Promise<number> {
		return this.call<number>('StateNetworkVersion', [tsk || null]);
	}

	async getStateCirculatingSupply(tsk?: { '/': string }[]): Promise<{
		FilVested: string;
		FilMined: string;
		FilBurnt: string;
		FilLocked: string;
		FilCirculating: string;
		FilReserveDisbursed: string;
	}> {
		return this.call('StateCirculatingSupply', [tsk || null]);
	}

	// ==================== Wallet Methods ====================

	async getWalletBalance(address: string): Promise<string> {
		return this.call<string>('WalletBalance', [address]);
	}

	async getWalletDefaultAddress(): Promise<string> {
		return this.call<string>('WalletDefaultAddress');
	}

	async getWalletList(): Promise<string[]> {
		return this.call<string[]>('WalletList');
	}

	async walletNew(keyType: 'secp256k1' | 'bls'): Promise<string> {
		return this.call<string>('WalletNew', [keyType]);
	}

	async walletExport(address: string): Promise<{ Type: string; PrivateKey: string }> {
		return this.call('WalletExport', [address]);
	}

	async walletImport(key: { Type: string; PrivateKey: string }): Promise<string> {
		return this.call<string>('WalletImport', [key]);
	}

	async walletSetDefault(address: string): Promise<void> {
		return this.call<void>('WalletSetDefault', [address]);
	}

	async walletSign(address: string, data: string): Promise<{ Type: number; Data: string }> {
		return this.call('WalletSign', [address, data]);
	}

	async walletValidateAddress(address: string): Promise<string> {
		return this.call<string>('WalletValidateAddress', [address]);
	}

	// ==================== Message/Transaction Methods ====================

	async mpoolPush(signedMessage: SignedMessage): Promise<{ '/': string }> {
		return this.call('MpoolPush', [signedMessage]);
	}

	async mpoolPushMessage(message: Partial<FilecoinMessage>, maxFee?: { MaxFee: string }): Promise<SignedMessage> {
		return this.call<SignedMessage>('MpoolPushMessage', [message, maxFee || null]);
	}

	async mpoolGetNonce(address: string): Promise<number> {
		return this.call<number>('MpoolGetNonce', [address]);
	}

	async mpoolPending(tsk?: { '/': string }[]): Promise<SignedMessage[]> {
		return this.call<SignedMessage[]>('MpoolPending', [tsk || null]);
	}

	async stateWaitMsg(cid: { '/': string }, confidence: number): Promise<MessageLookup> {
		return this.call<MessageLookup>('StateWaitMsg', [cid, confidence]);
	}

	async stateSearchMsg(cid: { '/': string }): Promise<MessageLookup | null> {
		return this.call<MessageLookup | null>('StateSearchMsg', [cid]);
	}

	async stateGetReceipt(cid: { '/': string }, tsk?: { '/': string }[]): Promise<MessageReceipt> {
		return this.call<MessageReceipt>('StateGetReceipt', [cid, tsk || null]);
	}

	// ==================== Gas Methods ====================

	async gasEstimateMessageGas(message: Partial<FilecoinMessage>, maxFee?: { MaxFee: string }, tsk?: { '/': string }[]): Promise<FilecoinMessage> {
		return this.call<FilecoinMessage>('GasEstimateMessageGas', [message, maxFee || null, tsk || null]);
	}

	async gasEstimateGasLimit(message: Partial<FilecoinMessage>, tsk?: { '/': string }[]): Promise<number> {
		return this.call<number>('GasEstimateGasLimit', [message, tsk || null]);
	}

	async gasEstimateGasPremium(numBlocks: number, sender: string, gasLimit: number, tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('GasEstimateGasPremium', [numBlocks, sender, gasLimit, tsk || null]);
	}

	async gasEstimateFeeCap(message: Partial<FilecoinMessage>, maxBlocks: number, tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('GasEstimateFeeCap', [message, maxBlocks, tsk || null]);
	}

	// ==================== Miner Methods ====================

	async stateMinerInfo(address: string, tsk?: { '/': string }[]): Promise<MinerInfo> {
		return this.call<MinerInfo>('StateMinerInfo', [address, tsk || null]);
	}

	async stateMinerPower(address: string, tsk?: { '/': string }[]): Promise<MinerPower> {
		return this.call<MinerPower>('StateMinerPower', [address, tsk || null]);
	}

	async stateMinerAvailableBalance(address: string, tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('StateMinerAvailableBalance', [address, tsk || null]);
	}

	async stateMinerSectors(address: string, sectorNos?: number[], tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.call('StateMinerSectors', [address, sectorNos || null, tsk || null]);
	}

	async stateMinerActiveSectors(address: string, tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.call('StateMinerActiveSectors', [address, tsk || null]);
	}

	async stateMinerFaults(address: string, tsk?: { '/': string }[]): Promise<unknown> {
		return this.call('StateMinerFaults', [address, tsk || null]);
	}

	async stateMinerRecoveries(address: string, tsk?: { '/': string }[]): Promise<unknown> {
		return this.call('StateMinerRecoveries', [address, tsk || null]);
	}

	async stateMinerDeadlines(address: string, tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.call('StateMinerDeadlines', [address, tsk || null]);
	}

	async stateMinerPartitions(address: string, deadline: number, tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.call('StateMinerPartitions', [address, deadline, tsk || null]);
	}

	async stateMinerProvingDeadline(address: string, tsk?: { '/': string }[]): Promise<unknown> {
		return this.call('StateMinerProvingDeadline', [address, tsk || null]);
	}

	async stateMinerPreCommitDepositForPower(address: string, pci: unknown, tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('StateMinerPreCommitDepositForPower', [address, pci, tsk || null]);
	}

	async stateMinerInitialPledgeCollateral(address: string, pci: unknown, tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('StateMinerInitialPledgeCollateral', [address, pci, tsk || null]);
	}

	async stateListMiners(tsk?: { '/': string }[]): Promise<string[]> {
		return this.call<string[]>('StateListMiners', [tsk || null]);
	}

	// ==================== Market Methods ====================

	async stateMarketBalance(address: string, tsk?: { '/': string }[]): Promise<{ Escrow: string; Locked: string }> {
		return this.call('StateMarketBalance', [address, tsk || null]);
	}

	async stateMarketDeals(tsk?: { '/': string }[]): Promise<{ [key: string]: StorageDeal }> {
		return this.call('StateMarketDeals', [tsk || null]);
	}

	async stateMarketStorageDeal(dealId: number, tsk?: { '/': string }[]): Promise<StorageDeal> {
		return this.call<StorageDeal>('StateMarketStorageDeal', [dealId, tsk || null]);
	}

	async clientQueryAsk(peerId: string, miner: string): Promise<unknown> {
		return this.call('ClientQueryAsk', [peerId, miner]);
	}

	async clientListDeals(): Promise<unknown[]> {
		return this.call('ClientListDeals');
	}

	async clientGetDealInfo(dealCid: { '/': string }): Promise<unknown> {
		return this.call('ClientGetDealInfo', [dealCid]);
	}

	async clientGetDealStatus(dealCid: { '/': string }): Promise<number> {
		return this.call<number>('ClientGetDealStatus', [dealCid]);
	}

	// ==================== DataCap / Verified Registry Methods ====================

	async stateVerifiedClientStatus(address: string, tsk?: { '/': string }[]): Promise<string | null> {
		return this.call<string | null>('StateVerifiedClientStatus', [address, tsk || null]);
	}

	async stateVerifiedRegistryRootKey(tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('StateVerifiedRegistryRootKey', [tsk || null]);
	}

	async stateVerifierStatus(address: string, tsk?: { '/': string }[]): Promise<string | null> {
		return this.call<string | null>('StateVerifierStatus', [address, tsk || null]);
	}

	async stateListVerifiedClients(tsk?: { '/': string }[]): Promise<{ Address: string; DataCap: string }[]> {
		return this.call('StateListVerifiedClients', [tsk || null]);
	}

	// ==================== Multisig Methods ====================

	async msigGetAvailableBalance(address: string, tsk?: { '/': string }[]): Promise<string> {
		return this.call<string>('MsigGetAvailableBalance', [address, tsk || null]);
	}

	async msigGetVested(address: string, start: { '/': string }[], end: { '/': string }[]): Promise<string> {
		return this.call<string>('MsigGetVested', [address, start, end]);
	}

	async msigGetPending(address: string, tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.call('MsigGetPending', [address, tsk || null]);
	}

	async msigCreate(required: number, addresses: string[], unlockDuration: number, value: string, from: string, gasLimit: number): Promise<{ '/': string }> {
		return this.call('MsigCreate', [required, addresses, unlockDuration, value, from, gasLimit]);
	}

	async msigPropose(msigAddress: string, to: string, value: string, from: string, method: number, params: string): Promise<{ '/': string }> {
		return this.call('MsigPropose', [msigAddress, to, value, from, method, params]);
	}

	async msigApprove(msigAddress: string, txId: number, from: string): Promise<{ '/': string }> {
		return this.call('MsigApprove', [msigAddress, txId, from]);
	}

	async msigCancel(msigAddress: string, txId: number, from: string): Promise<{ '/': string }> {
		return this.call('MsigCancel', [msigAddress, txId, from]);
	}

	async msigAddSigner(msigAddress: string, proposer: string, newSigner: string, increase: boolean): Promise<{ '/': string }> {
		return this.call('MsigAddSigner', [msigAddress, proposer, newSigner, increase]);
	}

	async msigRemoveSigner(msigAddress: string, proposer: string, toRemove: string, decrease: boolean): Promise<{ '/': string }> {
		return this.call('MsigRemoveSigner', [msigAddress, proposer, toRemove, decrease]);
	}

	async msigSwapSigner(msigAddress: string, proposer: string, oldSigner: string, newSigner: string): Promise<{ '/': string }> {
		return this.call('MsigSwapSigner', [msigAddress, proposer, oldSigner, newSigner]);
	}

	// ==================== Payment Channel Methods ====================

	async paychGet(from: string, to: string, amount: string): Promise<{ Channel: string; WaitSentinel: { '/': string } }> {
		return this.call('PaychGet', [from, to, amount]);
	}

	async paychGetWaitReady(sentinel: { '/': string }): Promise<string> {
		return this.call<string>('PaychGetWaitReady', [sentinel]);
	}

	async paychAllocateLane(channel: string): Promise<number> {
		return this.call<number>('PaychAllocateLane', [channel]);
	}

	async paychSettle(channel: string): Promise<{ '/': string }> {
		return this.call('PaychSettle', [channel]);
	}

	async paychCollect(channel: string): Promise<{ '/': string }> {
		return this.call('PaychCollect', [channel]);
	}

	async paychStatus(channel: string): Promise<{ ControlAddr: string; Direction: number }> {
		return this.call('PaychStatus', [channel]);
	}

	async paychList(): Promise<string[]> {
		return this.call<string[]>('PaychList');
	}

	// ==================== Payment Channel Voucher Methods ====================

	async paychVoucherCreate(channel: string, amount: string, lane: number): Promise<{ Voucher: { ChannelAddr: string; Lane: number; Nonce: number; Amount: string; MinSettleHeight: number; Signature: { Type: number; Data: string } } }> {
		return this.call('PaychVoucherCreate', [channel, amount, lane]);
	}

	async paychVoucherSubmit(channel: string, voucher: unknown): Promise<{ '/': string }> {
		return this.call('PaychVoucherSubmit', [channel, voucher]);
	}

	// ==================== State Call ====================

	async stateCall(message: Partial<FilecoinMessage>, tsk?: { '/': string }[]): Promise<{ MsgRct: MessageReceipt; ExecutionTrace: unknown }> {
		return this.call('StateCall', [message, tsk || null]);
	}

	// ==================== Power Actor ====================

	async getStatePowerActor(tsk?: { '/': string }[]): Promise<{
		State?: {
			TotalRawBytePower: string;
			TotalQualityAdjPower: string;
			TotalPledgeCollateral: string;
			MinerCount: number;
			MinerAboveMinPowerCount: number;
		};
	}> {
		// Get the power actor state
		const actor = await this.getStateGetActor('f04', tsk);
		const state = await this.getStateReadState('f04', tsk);
		return { State: state?.State as {
			TotalRawBytePower: string;
			TotalQualityAdjPower: string;
			TotalPledgeCollateral: string;
			MinerCount: number;
			MinerAboveMinPowerCount: number;
		} };
	}

	// ==================== Aliases for method compatibility ====================

	async getStateMinerPower(address: string, tsk?: { '/': string }[]): Promise<MinerPower> {
		return this.stateMinerPower(address, tsk);
	}

	async getStateMinerInfo(address: string, tsk?: { '/': string }[]): Promise<MinerInfo> {
		return this.stateMinerInfo(address, tsk);
	}

	async getStateMinerSectors(address: string, sectorNos?: number[], tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.stateMinerSectors(address, sectorNos, tsk);
	}

	async getStateMinerActiveSectors(address: string, tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.stateMinerActiveSectors(address, tsk);
	}

	async getStateMinerFaults(address: string, tsk?: { '/': string }[]): Promise<unknown> {
		return this.stateMinerFaults(address, tsk);
	}

	async getStateMinerRecoveries(address: string, tsk?: { '/': string }[]): Promise<unknown> {
		return this.stateMinerRecoveries(address, tsk);
	}

	async getStateMinerDeadlines(address: string, tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.stateMinerDeadlines(address, tsk);
	}

	async getStateMinerPartitions(address: string, deadline: number, tsk?: { '/': string }[]): Promise<unknown[]> {
		return this.stateMinerPartitions(address, deadline, tsk);
	}

	async getStateMinerProvingDeadline(address: string, tsk?: { '/': string }[]): Promise<unknown> {
		return this.stateMinerProvingDeadline(address, tsk);
	}

	async getStateSectorGetInfo(address: string, sectorNumber: number, tsk?: { '/': string }[]): Promise<unknown> {
		return this.call('StateSectorGetInfo', [address, sectorNumber, tsk || null]);
	}

	async stateListActors(tsk?: { '/': string }[]): Promise<string[]> {
		return this.getStateListActors(tsk);
	}

	async stateReadState(address: string, tsk?: { '/': string }[]): Promise<{ Balance: string; Code: { '/': string }; State: unknown }> {
		return this.getStateReadState(address, tsk);
	}

	// ==================== Version ====================

	async version(): Promise<{ Version: string; APIVersion: number; BlockDelay: number }> {
		return this.call('Version');
	}

	async walletVerify(address: string, data: string, signature: { Type: number; Data: string }): Promise<boolean> {
		return this.call<boolean>('WalletVerify', [address, Buffer.from(data).toString('base64'), signature]);
	}
}

/**
 * Create a Lotus client from n8n credentials
 */
export function createLotusClient(credentials: {
	network: string;
	lotusRpcUrl?: string;
	lotusApiToken?: string;
}): LotusClient {
	return new LotusClient({
		network: credentials.network as NetworkType | 'custom',
		rpcUrl: credentials.lotusRpcUrl,
		apiToken: credentials.lotusApiToken,
	});
}
