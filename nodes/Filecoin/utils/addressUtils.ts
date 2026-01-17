/**
 * Filecoin Address Utilities
 * Handle address validation, conversion, and manipulation
 */

import { ADDRESS_PATTERNS, ADDRESS_TYPES, getAddressType } from '../constants/addresses';

/**
 * Validate a Filecoin address
 * @param address - Address to validate
 * @returns True if valid
 */
export function validateAddress(address: string): boolean {
	if (!address || typeof address !== 'string') {
		return false;
	}
	
	// Check for Ethereum address
	if (address.startsWith('0x')) {
		return ADDRESS_PATTERNS.ETH_ADDRESS.test(address);
	}
	
	// Check prefix
	const prefix = address.charAt(0);
	if (prefix !== 'f' && prefix !== 't') {
		return false;
	}
	
	// Check protocol number
	const protocol = parseInt(address.charAt(1), 10);
	if (isNaN(protocol) || protocol < 0 || protocol > 4) {
		return false;
	}
	
	// Validate based on address type
	switch (protocol) {
		case ADDRESS_TYPES.ID:
			return ADDRESS_PATTERNS.ID_ADDRESS.test(address);
		case ADDRESS_TYPES.SECP256K1:
			return ADDRESS_PATTERNS.SECP256K1_ADDRESS.test(address);
		case ADDRESS_TYPES.ACTOR:
			return ADDRESS_PATTERNS.ACTOR_ADDRESS.test(address);
		case ADDRESS_TYPES.BLS:
			return ADDRESS_PATTERNS.BLS_ADDRESS.test(address);
		case ADDRESS_TYPES.DELEGATED:
			return address.length > 3; // Basic check for f4/t4
		default:
			return false;
	}
}

/**
 * Get address type name from address
 */
export function getAddressTypeName(address: string): string {
	const type = getAddressType(address);
	
	switch (type) {
		case ADDRESS_TYPES.ID:
			return 'ID';
		case ADDRESS_TYPES.SECP256K1:
			return 'Secp256k1';
		case ADDRESS_TYPES.ACTOR:
			return 'Actor';
		case ADDRESS_TYPES.BLS:
			return 'BLS';
		case ADDRESS_TYPES.DELEGATED:
			return 'Delegated (FEVM)';
		default:
			return 'Unknown';
	}
}

/**
 * Check if an address is robust (non-ID)
 * Robust addresses are stable across chain state changes
 */
export function isRobustAddress(address: string): boolean {
	const type = getAddressType(address);
	return type !== null && type !== ADDRESS_TYPES.ID;
}

/**
 * Extract ID from f0 address
 */
export function extractIdFromAddress(address: string): number | null {
	if (!ADDRESS_PATTERNS.ID_ADDRESS.test(address)) {
		return null;
	}
	return parseInt(address.slice(2), 10);
}

/**
 * Create f0 address from ID number
 */
export function createIdAddress(id: number, testnet: boolean = false): string {
	const prefix = testnet ? 't' : 'f';
	return `${prefix}0${id}`;
}

/**
 * Convert Ethereum address to Filecoin f4 address (EAM namespace)
 * @param ethAddress - Ethereum address (0x...)
 * @param testnet - Whether to use testnet prefix
 * @returns f4 address
 */
export function ethAddressToFilecoin(ethAddress: string, testnet: boolean = false): string {
	if (!ADDRESS_PATTERNS.ETH_ADDRESS.test(ethAddress)) {
		throw new Error('Invalid Ethereum address');
	}
	
	// For EAM (Ethereum Address Manager), namespace ID is 10
	const prefix = testnet ? 't' : 'f';
	const cleanAddress = ethAddress.toLowerCase().slice(2);
	
	// Convert hex to base32 for Filecoin address
	// This is a simplified version - actual conversion requires proper base32 encoding
	return `${prefix}410f${cleanAddress}`;
}

/**
 * Extract Ethereum address from f4 address (if possible)
 */
export function filecoinToEthAddress(f4Address: string): string | null {
	if (!f4Address.match(/^[ft]410f[a-f0-9]{40}$/i)) {
		return null;
	}
	
	// Extract the Ethereum address portion
	const ethPart = f4Address.slice(5);
	return `0x${ethPart}`;
}

/**
 * Normalize address to a consistent format
 */
export function normalizeAddress(address: string): string {
	if (!address) return '';
	
	// Convert to lowercase
	let normalized = address.toLowerCase();
	
	// Handle Ethereum addresses
	if (normalized.startsWith('0x')) {
		return normalized;
	}
	
	return normalized;
}

/**
 * Format address for display (truncated)
 */
export function formatAddressShort(address: string, chars: number = 6): string {
	if (!address || address.length <= chars * 2 + 3) {
		return address;
	}
	return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Check if two addresses are equal (accounting for different formats)
 */
export function addressesEqual(addr1: string, addr2: string): boolean {
	const norm1 = normalizeAddress(addr1);
	const norm2 = normalizeAddress(addr2);
	return norm1 === norm2;
}

/**
 * Get the network from an address (mainnet or testnet)
 */
export function getNetworkFromAddress(address: string): 'mainnet' | 'testnet' | 'unknown' {
	if (address.startsWith('f')) return 'mainnet';
	if (address.startsWith('t')) return 'testnet';
	if (address.startsWith('0x')) return 'unknown'; // Could be either
	return 'unknown';
}

/**
 * Convert address between networks (f -> t or t -> f)
 */
export function convertAddressNetwork(address: string, toTestnet: boolean): string {
	if (!address || address.length < 2) return address;
	
	const currentPrefix = address.charAt(0);
	if (currentPrefix !== 'f' && currentPrefix !== 't') return address;
	
	const newPrefix = toTestnet ? 't' : 'f';
	return newPrefix + address.slice(1);
}

/**
 * Checksum validation for addresses
 * Note: This is a basic implementation - full validation requires crypto libraries
 */
export function hasValidChecksum(address: string): boolean {
	// Basic length and format checks
	if (!validateAddress(address)) {
		return false;
	}
	
	// More thorough checksum validation would require:
	// 1. Blake2b hashing
	// 2. Base32 decoding
	// 3. Checksum comparison
	
	return true;
}
