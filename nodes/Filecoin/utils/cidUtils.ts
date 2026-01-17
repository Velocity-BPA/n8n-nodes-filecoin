/**
 * Filecoin CID (Content Identifier) Utilities
 * Handle CID validation, parsing, and conversion
 */

/**
 * CID version constants
 */
export const CID_VERSIONS = {
	V0: 0,
	V1: 1,
} as const;

/**
 * Common multicodec codes used in Filecoin
 */
export const MULTICODEC = {
	// Hash functions
	SHA2_256: 0x12,
	BLAKE2B_256: 0xb220,
	
	// Content types
	DAG_PB: 0x70,
	DAG_CBOR: 0x71,
	RAW: 0x55,
	
	// Filecoin-specific
	FIL_COMMITMENT_UNSEALED: 0xf101,
	FIL_COMMITMENT_SEALED: 0xf102,
} as const;

/**
 * CID pattern for validation
 */
const CID_V0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CID_V1_PATTERN = /^b[a-z2-7]{58,}$/;
const CID_BASE32_PATTERN = /^ba[a-z2-7]+$/;

/**
 * Validate a CID string
 */
export function validateCid(cid: string): boolean {
	if (!cid || typeof cid !== 'string') {
		return false;
	}
	
	// CIDv0 (base58btc, starts with Qm)
	if (cid.startsWith('Qm')) {
		return CID_V0_PATTERN.test(cid);
	}
	
	// CIDv1 (various bases)
	if (cid.startsWith('b')) {
		return cid.length >= 59;
	}
	
	// CIDv1 with base32
	if (cid.startsWith('ba')) {
		return CID_BASE32_PATTERN.test(cid);
	}
	
	return false;
}

/**
 * Get CID version from string
 */
export function getCidVersion(cid: string): number | null {
	if (!cid) return null;
	
	if (cid.startsWith('Qm')) {
		return CID_VERSIONS.V0;
	}
	
	if (cid.startsWith('b') || cid.startsWith('z') || cid.startsWith('f')) {
		return CID_VERSIONS.V1;
	}
	
	return null;
}

/**
 * Check if CID is a piece CID (CommP)
 * Piece CIDs are used for storage deal piece commitments
 */
export function isPieceCid(cid: string): boolean {
	// Piece CIDs typically use fil-commitment-unsealed codec
	// They start with 'baga' in base32
	return cid.startsWith('baga');
}

/**
 * Check if CID is a data CID (CommD)
 * Data CIDs represent the data commitment
 */
export function isDataCid(cid: string): boolean {
	// Data CIDs can be any valid CID
	return validateCid(cid);
}

/**
 * Format CID for display (truncated)
 */
export function formatCidShort(cid: string, chars: number = 8): string {
	if (!cid || cid.length <= chars * 2 + 3) {
		return cid;
	}
	return `${cid.slice(0, chars)}...${cid.slice(-chars)}`;
}

/**
 * Compare two CIDs for equality
 */
export function cidsEqual(cid1: string, cid2: string): boolean {
	// Note: This is a simple string comparison
	// Full CID comparison would require parsing and comparing
	// the underlying bytes
	return cid1 === cid2;
}

/**
 * Extract base encoding from CID
 */
export function getCidBase(cid: string): string {
	if (cid.startsWith('Qm') || cid.startsWith('1')) {
		return 'base58btc';
	}
	if (cid.startsWith('b')) {
		return 'base32';
	}
	if (cid.startsWith('z')) {
		return 'base58btc';
	}
	if (cid.startsWith('f')) {
		return 'base16';
	}
	if (cid.startsWith('u')) {
		return 'base64url';
	}
	return 'unknown';
}

/**
 * Create a CID link for Filecoin explorers
 */
export function getCidExplorerLink(cid: string, network: 'mainnet' | 'calibration' = 'mainnet'): string {
	const baseUrl = network === 'mainnet' 
		? 'https://filfox.info/en/message'
		: 'https://calibration.filfox.info/en/message';
	
	return `${baseUrl}/${cid}`;
}

/**
 * Create an IPFS gateway link for a CID
 */
export function getIpfsGatewayLink(cid: string, gateway: string = 'https://dweb.link'): string {
	return `${gateway}/ipfs/${cid}`;
}

/**
 * Validate piece CID size
 * Piece CIDs must be power of 2 padded
 */
export function validatePieceSize(size: bigint): boolean {
	// Valid piece sizes are powers of 2 from 256 bytes to 64 GiB
	const minSize = 256n;
	const maxSize = 64n * 1024n * 1024n * 1024n; // 64 GiB
	
	if (size < minSize || size > maxSize) {
		return false;
	}
	
	// Check if power of 2
	return (size & (size - 1n)) === 0n;
}

/**
 * Calculate padded piece size
 * Filecoin requires piece sizes to be powers of 2
 */
export function calculatePaddedPieceSize(dataSize: bigint): bigint {
	if (dataSize <= 0n) return 256n;
	
	// Find next power of 2
	let size = 1n;
	while (size < dataSize) {
		size *= 2n;
	}
	
	// Minimum piece size is 256 bytes
	return size < 256n ? 256n : size;
}

/**
 * Parse CID from various formats
 */
export function parseCid(input: string): { cid: string; valid: boolean; version: number | null } {
	const trimmed = input.trim();
	
	// Handle potential URL format
	let cid = trimmed;
	
	// Extract from IPFS URL
	if (trimmed.includes('/ipfs/')) {
		const parts = trimmed.split('/ipfs/');
		cid = parts[parts.length - 1].split('/')[0];
	}
	
	// Extract from dweb.link or other gateways
	if (trimmed.includes('dweb.link')) {
		const match = trimmed.match(/\/ipfs\/([a-zA-Z0-9]+)/);
		if (match) cid = match[1];
	}
	
	const valid = validateCid(cid);
	const version = getCidVersion(cid);
	
	return { cid, valid, version };
}
