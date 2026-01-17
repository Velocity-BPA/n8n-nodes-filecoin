/**
 * Filecoin Unit Conversion Utilities
 * Handle conversions between FIL, attoFIL, and other denominations
 */

import BigNumber from 'bignumber.js';

// Configure BigNumber for high precision
BigNumber.config({
	DECIMAL_PLACES: 36,
	ROUNDING_MODE: BigNumber.ROUND_DOWN,
});

/**
 * FIL denominations
 */
export const FIL_DENOMINATIONS = {
	attoFIL: '1',
	femtoFIL: '1000',
	picoFIL: '1000000',
	nanoFIL: '1000000000',
	microFIL: '1000000000000',
	milliFIL: '1000000000000000',
	FIL: '1000000000000000000',
} as const;

export type FilDenomination = keyof typeof FIL_DENOMINATIONS;

/**
 * Convert FIL to attoFIL
 * @param fil - Amount in FIL
 * @returns Amount in attoFIL as string
 */
export function filToAttoFil(fil: string | number): string {
	const bn = new BigNumber(fil);
	return bn.multipliedBy(FIL_DENOMINATIONS.FIL).toFixed(0);
}

/**
 * Convert attoFIL to FIL
 * @param attoFil - Amount in attoFIL
 * @returns Amount in FIL as string
 */
export function attoFilToFil(attoFil: string | number | bigint): string {
	const bn = new BigNumber(attoFil.toString());
	return bn.dividedBy(FIL_DENOMINATIONS.FIL).toFixed();
}

/**
 * Convert between any FIL denominations
 * @param amount - Amount to convert
 * @param from - Source denomination
 * @param to - Target denomination
 * @returns Converted amount as string
 */
export function convertFilUnits(
	amount: string | number,
	from: FilDenomination,
	to: FilDenomination
): string {
	const bn = new BigNumber(amount);
	const fromMultiplier = new BigNumber(FIL_DENOMINATIONS[from]);
	const toMultiplier = new BigNumber(FIL_DENOMINATIONS[to]);
	
	// Convert to attoFIL first, then to target denomination
	const inAttoFil = bn.multipliedBy(fromMultiplier);
	return inAttoFil.dividedBy(toMultiplier).toFixed();
}

/**
 * Format FIL amount for display
 * @param attoFil - Amount in attoFIL
 * @param decimals - Number of decimal places to show
 * @returns Formatted FIL string
 */
export function formatFil(attoFil: string | number | bigint, decimals: number = 4): string {
	const fil = attoFilToFil(attoFil);
	const bn = new BigNumber(fil);
	return bn.toFixed(decimals);
}

/**
 * Parse user input to attoFIL
 * Handles various formats: "1 FIL", "1.5", "1000000000000000000 attoFIL"
 * @param input - User input string
 * @returns Amount in attoFIL
 */
export function parseFilInput(input: string): string {
	const trimmed = input.trim().toLowerCase();
	
	// Check for denomination suffix
	for (const [denom, multiplier] of Object.entries(FIL_DENOMINATIONS)) {
		if (trimmed.endsWith(denom.toLowerCase())) {
			const amount = trimmed.replace(denom.toLowerCase(), '').trim();
			return convertFilUnits(amount, denom as FilDenomination, 'attoFIL');
		}
	}
	
	// Default to FIL if no denomination specified
	if (trimmed.includes('.') || parseFloat(trimmed) < 1000000) {
		return filToAttoFil(trimmed);
	}
	
	// Large numbers without decimals assumed to be attoFIL
	return trimmed;
}

/**
 * Convert bytes to human-readable size
 */
export function formatBytes(bytes: number | bigint): string {
	const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
	let value = Number(bytes);
	let unitIndex = 0;
	
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex++;
	}
	
	return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Parse size string to bytes
 */
export function parseBytes(size: string): bigint {
	const units: { [key: string]: bigint } = {
		'b': 1n,
		'kib': 1024n,
		'mib': 1024n ** 2n,
		'gib': 1024n ** 3n,
		'tib': 1024n ** 4n,
		'pib': 1024n ** 5n,
		'eib': 1024n ** 6n,
		'kb': 1000n,
		'mb': 1000n ** 2n,
		'gb': 1000n ** 3n,
		'tb': 1000n ** 4n,
		'pb': 1000n ** 5n,
	};
	
	const match = size.toLowerCase().match(/^([\d.]+)\s*([a-z]+)$/);
	if (!match) {
		return BigInt(size);
	}
	
	const [, value, unit] = match;
	const multiplier = units[unit] || 1n;
	return BigInt(Math.floor(parseFloat(value))) * multiplier;
}

/**
 * Convert epoch to timestamp
 */
export function epochToTimestamp(epoch: number, genesisTimestamp: number = 1598306400): number {
	return genesisTimestamp + (epoch * 30);
}

/**
 * Convert timestamp to epoch
 */
export function timestampToEpoch(timestamp: number, genesisTimestamp: number = 1598306400): number {
	return Math.floor((timestamp - genesisTimestamp) / 30);
}

/**
 * Format epoch duration to human-readable string
 */
export function formatEpochDuration(epochs: number): string {
	const days = Math.floor(epochs / 2880);
	const hours = Math.floor((epochs % 2880) / 120);
	const minutes = Math.floor((epochs % 120) / 2);
	
	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	
	return parts.join(' ') || '0m';
}

/**
 * Validate FIL amount string
 */
export function isValidFilAmount(amount: string): boolean {
	try {
		const bn = new BigNumber(amount);
		return !bn.isNaN() && bn.isFinite() && bn.isGreaterThanOrEqualTo(0);
	} catch {
		return false;
	}
}
