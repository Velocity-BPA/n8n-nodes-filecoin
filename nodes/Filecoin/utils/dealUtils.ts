/**
 * Filecoin Storage Deal Utilities
 * Handle deal calculations, validations, and status tracking
 */

import { DEAL_CONSTANTS, EPOCH_CONSTANTS } from '../constants/networks';

/**
 * Deal states
 */
export const DEAL_STATES = {
	UNKNOWN: 0,
	PROPOSAL_NOT_FOUND: 1,
	PROPOSAL_REJECTED: 2,
	PROPOSAL_ACCEPTED: 3,
	STAGED: 4,
	SEALING: 5,
	FINALIZING: 6,
	ACTIVE: 7,
	EXPIRED: 8,
	SLASHED: 9,
	ERROR: 10,
} as const;

export type DealState = (typeof DEAL_STATES)[keyof typeof DEAL_STATES];

/**
 * Deal state labels for display
 */
export const DEAL_STATE_LABELS: { [key: number]: string } = {
	[DEAL_STATES.UNKNOWN]: 'Unknown',
	[DEAL_STATES.PROPOSAL_NOT_FOUND]: 'Proposal Not Found',
	[DEAL_STATES.PROPOSAL_REJECTED]: 'Proposal Rejected',
	[DEAL_STATES.PROPOSAL_ACCEPTED]: 'Proposal Accepted',
	[DEAL_STATES.STAGED]: 'Staged',
	[DEAL_STATES.SEALING]: 'Sealing',
	[DEAL_STATES.FINALIZING]: 'Finalizing',
	[DEAL_STATES.ACTIVE]: 'Active',
	[DEAL_STATES.EXPIRED]: 'Expired',
	[DEAL_STATES.SLASHED]: 'Slashed',
	[DEAL_STATES.ERROR]: 'Error',
};

/**
 * Get deal state label from state number
 */
export function getDealStateLabel(state: number): string {
	return DEAL_STATE_LABELS[state] || 'Unknown';
}

/**
 * Validate deal duration in epochs
 */
export function validateDealDuration(startEpoch: number, endEpoch: number): {
	valid: boolean;
	error?: string;
} {
	const duration = endEpoch - startEpoch;
	
	if (duration < DEAL_CONSTANTS.MIN_DEAL_DURATION_EPOCHS) {
		return {
			valid: false,
			error: `Deal duration ${duration} epochs is less than minimum ${DEAL_CONSTANTS.MIN_DEAL_DURATION_EPOCHS} epochs (~180 days)`,
		};
	}
	
	if (duration > DEAL_CONSTANTS.MAX_DEAL_DURATION_EPOCHS) {
		return {
			valid: false,
			error: `Deal duration ${duration} epochs exceeds maximum ${DEAL_CONSTANTS.MAX_DEAL_DURATION_EPOCHS} epochs (~540 days)`,
		};
	}
	
	return { valid: true };
}

/**
 * Calculate deal start epoch with buffer
 */
export function calculateDealStartEpoch(currentEpoch: number): number {
	return currentEpoch + DEAL_CONSTANTS.DEAL_START_BUFFER_EPOCHS;
}

/**
 * Calculate deal end epoch from duration in days
 */
export function calculateDealEndEpoch(startEpoch: number, durationDays: number): number {
	const durationEpochs = durationDays * EPOCH_CONSTANTS.EPOCHS_PER_DAY;
	return startEpoch + durationEpochs;
}

/**
 * Convert duration days to epochs
 */
export function daysToEpochs(days: number): number {
	return Math.floor(days * EPOCH_CONSTANTS.EPOCHS_PER_DAY);
}

/**
 * Convert epochs to days
 */
export function epochsToDays(epochs: number): number {
	return epochs / EPOCH_CONSTANTS.EPOCHS_PER_DAY;
}

/**
 * Calculate storage price for a deal
 * @param pricePerEpochPerByte - Storage price per epoch per byte in attoFIL
 * @param dataSize - Data size in bytes
 * @param durationEpochs - Deal duration in epochs
 * @returns Total storage cost in attoFIL
 */
export function calculateStorageCost(
	pricePerEpochPerByte: bigint,
	dataSize: bigint,
	durationEpochs: number
): bigint {
	return pricePerEpochPerByte * dataSize * BigInt(durationEpochs);
}

/**
 * Calculate provider collateral for a deal
 * This is a simplified calculation - actual collateral depends on network parameters
 */
export function calculateProviderCollateral(
	dataSize: bigint,
	durationEpochs: number,
	verifiedDeal: boolean
): bigint {
	// Base collateral per byte per epoch (simplified)
	const baseCollateral = 1000000n; // 1 nanoFIL
	
	let collateral = baseCollateral * dataSize * BigInt(durationEpochs);
	
	// Verified deals may have different collateral requirements
	if (verifiedDeal) {
		collateral = collateral / 10n; // 10x less collateral for verified deals
	}
	
	return collateral;
}

/**
 * Calculate client collateral for a deal
 */
export function calculateClientCollateral(dataSize: bigint): bigint {
	// Minimal client collateral (simplified)
	return dataSize * 1000n; // 1 nanoFIL per byte
}

/**
 * Check if deal is Fil+ verified
 */
export function isVerifiedDeal(deal: {
	verified?: boolean;
	verifiedDeal?: boolean;
	VerifiedDeal?: boolean;
}): boolean {
	return deal.verified || deal.verifiedDeal || deal.VerifiedDeal || false;
}

/**
 * Calculate deal expiration timestamp
 */
export function calculateDealExpiration(
	endEpoch: number,
	genesisTimestamp: number = EPOCH_CONSTANTS.MAINNET_GENESIS_TIMESTAMP
): Date {
	const timestamp = genesisTimestamp + (endEpoch * EPOCH_CONSTANTS.SECONDS_PER_EPOCH);
	return new Date(timestamp * 1000);
}

/**
 * Calculate remaining deal duration
 */
export function calculateRemainingDuration(
	currentEpoch: number,
	endEpoch: number
): { epochs: number; days: number; expired: boolean } {
	const remainingEpochs = endEpoch - currentEpoch;
	
	if (remainingEpochs <= 0) {
		return { epochs: 0, days: 0, expired: true };
	}
	
	return {
		epochs: remainingEpochs,
		days: epochsToDays(remainingEpochs),
		expired: false,
	};
}

/**
 * Format deal duration for display
 */
export function formatDealDuration(epochs: number): string {
	const days = epochsToDays(epochs);
	
	if (days < 1) {
		const hours = Math.floor(epochs / EPOCH_CONSTANTS.EPOCHS_PER_HOUR);
		return `${hours} hours`;
	}
	
	if (days < 30) {
		return `${Math.floor(days)} days`;
	}
	
	const months = Math.floor(days / 30);
	const remainingDays = Math.floor(days % 30);
	
	if (remainingDays === 0) {
		return `${months} month${months > 1 ? 's' : ''}`;
	}
	
	return `${months} month${months > 1 ? 's' : ''}, ${remainingDays} days`;
}

/**
 * Validate deal proposal parameters
 */
export function validateDealProposal(proposal: {
	pieceCid: string;
	pieceSize: bigint;
	client: string;
	provider: string;
	startEpoch: number;
	endEpoch: number;
	storagePricePerEpoch: bigint;
}): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	
	// Validate piece CID
	if (!proposal.pieceCid || !proposal.pieceCid.startsWith('baga')) {
		errors.push('Invalid piece CID format');
	}
	
	// Validate piece size (must be power of 2)
	if ((proposal.pieceSize & (proposal.pieceSize - 1n)) !== 0n) {
		errors.push('Piece size must be a power of 2');
	}
	
	// Validate addresses
	if (!proposal.client.match(/^[ft][0-4]/)) {
		errors.push('Invalid client address');
	}
	
	if (!proposal.provider.match(/^[ft]0/)) {
		errors.push('Provider must be an ID address (f0/t0)');
	}
	
	// Validate duration
	const durationValidation = validateDealDuration(proposal.startEpoch, proposal.endEpoch);
	if (!durationValidation.valid) {
		errors.push(durationValidation.error!);
	}
	
	// Validate price
	if (proposal.storagePricePerEpoch < 0n) {
		errors.push('Storage price cannot be negative');
	}
	
	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Calculate deal QAP (Quality Adjusted Power)
 * Verified deals get 10x power multiplier
 */
export function calculateDealQAP(
	rawSize: bigint,
	verified: boolean
): bigint {
	const multiplier = verified ? 10n : 1n;
	return rawSize * multiplier;
}

/**
 * Parse deal ID from various formats
 */
export function parseDealId(input: string | number): number | null {
	if (typeof input === 'number') {
		return input;
	}
	
	// Handle string input
	const trimmed = input.trim();
	
	// Handle URL format (e.g., from explorer)
	if (trimmed.includes('/deal/')) {
		const match = trimmed.match(/\/deal\/(\d+)/);
		if (match) return parseInt(match[1], 10);
	}
	
	// Parse direct number
	const parsed = parseInt(trimmed, 10);
	return isNaN(parsed) ? null : parsed;
}
