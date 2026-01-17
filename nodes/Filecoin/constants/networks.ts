/**
 * Filecoin Network Configuration Constants
 */

export const NETWORKS = {
	mainnet: {
		name: 'Filecoin Mainnet',
		chainId: 314,
		networkId: 'mainnet',
		lotusRpc: 'https://api.node.glif.io/rpc/v1',
		fevmRpc: 'https://api.node.glif.io/rpc/v1',
		explorer: 'https://filfox.info/en',
		explorerApi: 'https://filfox.info/api/v1',
		beryx: 'https://api.zondax.ch/fil/data/v3/mainnet',
		symbol: 'FIL',
		decimals: 18,
	},
	calibration: {
		name: 'Filecoin Calibration Testnet',
		chainId: 314159,
		networkId: 'calibration',
		lotusRpc: 'https://api.calibration.node.glif.io/rpc/v1',
		fevmRpc: 'https://api.calibration.node.glif.io/rpc/v1',
		explorer: 'https://calibration.filfox.info/en',
		explorerApi: 'https://calibration.filfox.info/api/v1',
		beryx: 'https://api.zondax.ch/fil/data/v3/calibration',
		symbol: 'tFIL',
		decimals: 18,
	},
	hyperspace: {
		name: 'Filecoin Hyperspace Testnet',
		chainId: 3141,
		networkId: 'hyperspace',
		lotusRpc: 'https://api.hyperspace.node.glif.io/rpc/v1',
		fevmRpc: 'https://api.hyperspace.node.glif.io/rpc/v1',
		explorer: 'https://hyperspace.filfox.info/en',
		explorerApi: 'https://hyperspace.filfox.info/api/v1',
		beryx: 'https://api.zondax.ch/fil/data/v3/hyperspace',
		symbol: 'tFIL',
		decimals: 18,
	},
} as const;

export type NetworkType = keyof typeof NETWORKS;

/**
 * Get network configuration by name
 */
export function getNetworkConfig(network: NetworkType | 'custom', customRpc?: string) {
	if (network === 'custom' && customRpc) {
		return {
			...NETWORKS.mainnet,
			name: 'Custom Network',
			lotusRpc: customRpc,
			fevmRpc: customRpc,
		};
	}
	return NETWORKS[network as NetworkType] || NETWORKS.mainnet;
}

/**
 * Filecoin address prefixes by network
 */
export const ADDRESS_PREFIXES = {
	mainnet: 'f',
	calibration: 't',
	hyperspace: 't',
} as const;

/**
 * Epoch and block time constants
 */
export const EPOCH_CONSTANTS = {
	SECONDS_PER_EPOCH: 30,
	EPOCHS_PER_DAY: 2880,
	EPOCHS_PER_HOUR: 120,
	MAINNET_GENESIS_TIMESTAMP: 1598306400, // August 24, 2020
	CALIBRATION_GENESIS_TIMESTAMP: 1667326380,
} as const;

/**
 * Deal duration constants
 */
export const DEAL_CONSTANTS = {
	MIN_DEAL_DURATION_EPOCHS: 518400, // ~180 days
	MAX_DEAL_DURATION_EPOCHS: 1555200, // ~540 days
	DEAL_START_BUFFER_EPOCHS: 20160, // ~7 days buffer
} as const;

/**
 * Sector sizes
 */
export const SECTOR_SIZES = {
	'32GiB': 34359738368n,
	'64GiB': 68719476736n,
} as const;

/**
 * FIL denomination constants
 */
export const FIL_CONSTANTS = {
	ATTO_FIL_PER_FIL: 1000000000000000000n,
	FEMTO_FIL_PER_FIL: 1000000000000000n,
	PICO_FIL_PER_FIL: 1000000000000n,
	NANO_FIL_PER_FIL: 1000000000n,
} as const;
