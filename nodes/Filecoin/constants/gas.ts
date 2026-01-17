/**
 * Filecoin Gas Constants and Parameters
 */

/**
 * Default gas parameters for various message types
 */
export const GAS_DEFAULTS = {
	// Default gas limit for simple transfers
	TRANSFER_GAS_LIMIT: 10000000n,
	
	// Default gas limits by message type
	SIMPLE_SEND: 10000000n,
	INVOKE_ACTOR: 50000000n,
	PUBLISH_DEALS: 100000000n,
	PROVE_COMMIT: 500000000n,
	WINDOW_POST: 1000000000n,
	
	// Gas premium multipliers
	LOW_PRIORITY_MULTIPLIER: 0.8,
	MEDIUM_PRIORITY_MULTIPLIER: 1.0,
	HIGH_PRIORITY_MULTIPLIER: 1.25,
	URGENT_PRIORITY_MULTIPLIER: 1.5,
	
	// Default fee cap as percentage of balance
	DEFAULT_FEE_CAP_PERCENTAGE: 0.01, // 1% of balance
} as const;

/**
 * Gas computation constants
 */
export const GAS_COMPUTATION = {
	// Base gas units
	GAS_UNITS_PER_EPOCH: 10000000000n,
	
	// Message gas costs
	ON_CHAIN_MESSAGE_COMPUTE_BASE: 38863n,
	ON_CHAIN_MESSAGE_STORAGE_BASE: 36n,
	ON_CHAIN_MESSAGE_STORAGE_PER_BYTE: 1n,
	
	// Signature verification costs
	SIG_COST_SECP256K1: 1637292n,
	SIG_COST_BLS: 16598605n,
	
	// Actor method costs
	ACTOR_LOOKUP_COST: 500000n,
	ACTOR_UPDATE_COST: 475000n,
	ACTOR_CREATE_COST: 2500000n,
	
	// Storage costs
	IPLD_GET_COST: 114617n,
	IPLD_PUT_COST: 353640n,
	IPLD_PUT_PER_BYTE: 1n,
	
	// Send costs
	SEND_BASE_COST: 29233n,
	SEND_TRANSFER_FUNDS: 27500n,
	SEND_TRANSFER_ONLY_PREMIUM: 159672n,
	SEND_INVOKE_METHOD: 3000n,
} as const;

/**
 * Gas overestimation parameters
 */
export const GAS_OVERESTIMATION = {
	// Percentage to add to estimated gas for safety
	GAS_LIMIT_OVERESTIMATION: 1.25,
	
	// Minimum gas limit regardless of estimation
	MIN_GAS_LIMIT: 1000000n,
	
	// Maximum gas limit per message
	MAX_GAS_LIMIT: 10000000000n,
	
	// Block gas limit
	BLOCK_GAS_LIMIT: 10000000000n,
} as const;

/**
 * Base fee burning parameters
 */
export const BASE_FEE = {
	// Minimum base fee
	MIN_BASE_FEE: 100n,
	
	// Base fee change denominator
	BASE_FEE_CHANGE_DENOMINATOR: 8n,
	
	// Initial base fee
	INITIAL_BASE_FEE: 100000000n,
	
	// Block gas target (50% of block gas limit)
	BLOCK_GAS_TARGET: 5000000000n,
} as const;

/**
 * FEVM gas parameters
 */
export const FEVM_GAS = {
	// EVM gas to Filecoin gas conversion
	EVM_GAS_MULTIPLIER: 1n,
	
	// Default gas prices in attoFIL
	DEFAULT_GAS_PRICE: 100000000000n, // 100 nanoFIL
	MIN_GAS_PRICE: 1000000000n, // 1 nanoFIL
	MAX_GAS_PRICE: 10000000000000n, // 10 microFIL
	
	// EIP-1559 parameters
	MAX_PRIORITY_FEE_PER_GAS: 1500000000n, // 1.5 nanoFIL
	
	// Gas limits for common operations
	ETH_TRANSFER_GAS: 21000n,
	CONTRACT_DEPLOY_MIN_GAS: 100000n,
	CONTRACT_CALL_MIN_GAS: 50000n,
} as const;

/**
 * Get recommended gas parameters for a message type
 */
export function getRecommendedGas(messageType: string): { gasLimit: bigint; gasPremiumMultiplier: number } {
	switch (messageType.toLowerCase()) {
		case 'send':
		case 'transfer':
			return { gasLimit: GAS_DEFAULTS.SIMPLE_SEND, gasPremiumMultiplier: GAS_DEFAULTS.MEDIUM_PRIORITY_MULTIPLIER };
		case 'invoke':
			return { gasLimit: GAS_DEFAULTS.INVOKE_ACTOR, gasPremiumMultiplier: GAS_DEFAULTS.MEDIUM_PRIORITY_MULTIPLIER };
		case 'publishdeals':
		case 'publish_deals':
			return { gasLimit: GAS_DEFAULTS.PUBLISH_DEALS, gasPremiumMultiplier: GAS_DEFAULTS.HIGH_PRIORITY_MULTIPLIER };
		case 'provecommit':
		case 'prove_commit':
			return { gasLimit: GAS_DEFAULTS.PROVE_COMMIT, gasPremiumMultiplier: GAS_DEFAULTS.HIGH_PRIORITY_MULTIPLIER };
		case 'windowpost':
		case 'window_post':
			return { gasLimit: GAS_DEFAULTS.WINDOW_POST, gasPremiumMultiplier: GAS_DEFAULTS.URGENT_PRIORITY_MULTIPLIER };
		default:
			return { gasLimit: GAS_DEFAULTS.INVOKE_ACTOR, gasPremiumMultiplier: GAS_DEFAULTS.MEDIUM_PRIORITY_MULTIPLIER };
	}
}
