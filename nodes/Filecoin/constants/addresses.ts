/**
 * Filecoin Address Constants and Common Addresses
 */

/**
 * Address type prefixes
 * f0 - ID addresses (short numeric)
 * f1 - secp256k1 addresses (most common)
 * f2 - Actor addresses (smart contracts)
 * f3 - BLS addresses (multisig-friendly)
 * f4 - Delegated addresses (FEVM, user-defined)
 */
export const ADDRESS_TYPES = {
	ID: 0,           // f0 - ID address
	SECP256K1: 1,    // f1 - secp256k1 public key hash
	ACTOR: 2,        // f2 - Actor address
	BLS: 3,          // f3 - BLS public key
	DELEGATED: 4,    // f4 - Delegated (FEVM/EAM)
} as const;

/**
 * Address protocol indicators
 */
export const ADDRESS_PROTOCOLS = {
	0: 'ID',
	1: 'Secp256k1',
	2: 'Actor',
	3: 'BLS',
	4: 'Delegated',
} as const;

/**
 * Address lengths by type (in bytes, excluding protocol byte)
 */
export const ADDRESS_LENGTHS = {
	ID: 'variable', // Varint encoded
	SECP256K1: 20,  // 20-byte hash
	ACTOR: 20,      // 20-byte hash
	BLS: 48,        // 48-byte public key
	DELEGATED: 'variable', // Namespace + subaddress
} as const;

/**
 * Well-known FEVM addresses
 */
export const FEVM_ADDRESSES = {
	// Wrapped FIL (wFIL) on mainnet
	WFIL_MAINNET: '0x60E1773636CF5E4A227d9AC24F20fEca034ee25A',
	
	// Common DEX contracts on mainnet
	UNISWAP_ROUTER: '', // Add when deployed
	SUSHISWAP_ROUTER: '', // Add when deployed
	
	// Bridge contracts
	CELER_BRIDGE: '', // Add when deployed
	AXELAR_GATEWAY: '', // Add when deployed
} as const;

/**
 * Known notary addresses for Fil+ DataCap
 */
export const NOTARY_ADDRESSES = {
	// Root key holders
	ROOT_KEY_HOLDER_1: 'f080',
	ROOT_KEY_HOLDER_2: 'f081',
	
	// Example notaries (these change - use API for current list)
	// Add specific notary addresses as needed
} as const;

/**
 * Common storage provider addresses (examples)
 */
export const EXAMPLE_STORAGE_PROVIDERS = {
	// Example large storage providers
	// Note: These are examples and may change
	SP_EXAMPLE_1: 'f01234',
	SP_EXAMPLE_2: 'f05678',
} as const;

/**
 * Address validation regex patterns
 */
export const ADDRESS_PATTERNS = {
	// Mainnet addresses start with 'f'
	MAINNET: /^f[0-4][a-zA-Z0-9]+$/,
	
	// Testnet addresses start with 't'
	TESTNET: /^t[0-4][a-zA-Z0-9]+$/,
	
	// ID addresses (f0/t0)
	ID_ADDRESS: /^[ft]0[0-9]+$/,
	
	// Secp256k1 addresses (f1/t1)
	SECP256K1_ADDRESS: /^[ft]1[a-z2-7]{38,39}$/,
	
	// Actor addresses (f2/t2)
	ACTOR_ADDRESS: /^[ft]2[a-z2-7]{38,39}$/,
	
	// BLS addresses (f3/t3)
	BLS_ADDRESS: /^[ft]3[a-z2-7]{84,86}$/,
	
	// Delegated addresses (f4/t4) - FEVM
	DELEGATED_ADDRESS: /^[ft]4[0-9]+f[a-z2-7]+$/,
	
	// Ethereum address
	ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
} as const;

/**
 * Get address type from address string
 */
export function getAddressType(address: string): number | null {
	if (!address || address.length < 2) return null;
	
	const prefix = address.charAt(0);
	if (prefix !== 'f' && prefix !== 't') return null;
	
	const protocol = parseInt(address.charAt(1), 10);
	if (isNaN(protocol) || protocol < 0 || protocol > 4) return null;
	
	return protocol;
}

/**
 * Check if address is a mainnet address
 */
export function isMainnetAddress(address: string): boolean {
	return address.startsWith('f');
}

/**
 * Check if address is a testnet address
 */
export function isTestnetAddress(address: string): boolean {
	return address.startsWith('t');
}

/**
 * Check if address is an ID address (f0/t0)
 */
export function isIdAddress(address: string): boolean {
	return ADDRESS_PATTERNS.ID_ADDRESS.test(address);
}

/**
 * Check if address is a delegated/FEVM address (f4/t4)
 */
export function isDelegatedAddress(address: string): boolean {
	const prefix = address.substring(0, 2);
	return prefix === 'f4' || prefix === 't4';
}

/**
 * Check if address is an Ethereum address
 */
export function isEthAddress(address: string): boolean {
	return ADDRESS_PATTERNS.ETH_ADDRESS.test(address);
}
