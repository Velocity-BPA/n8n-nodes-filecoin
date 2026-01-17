/**
 * Filecoin Built-in Actor Addresses and Constants
 */

/**
 * Built-in actor IDs (f0 addresses)
 * These are singleton actors with fixed addresses
 */
export const BUILTIN_ACTORS = {
	// System actors
	SYSTEM_ACTOR: 'f00',
	INIT_ACTOR: 'f01',
	REWARD_ACTOR: 'f02',
	CRON_ACTOR: 'f03',
	STORAGE_POWER_ACTOR: 'f04',
	STORAGE_MARKET_ACTOR: 'f05',
	VERIFIED_REGISTRY_ACTOR: 'f06',
	DATACAP_ACTOR: 'f07',
	
	// Special addresses
	BURNT_FUNDS_ACTOR: 'f099',
	RESERVE_ACTOR: 'f090',
	
	// Ethereum precompiles (f4 addresses on FEVM)
	EAM_ACTOR: 'f010', // Ethereum Address Manager
} as const;

/**
 * Actor code CIDs for different actor types
 * Used to identify actor types from their code
 */
export const ACTOR_CODES = {
	// Built-in actors (v12)
	SYSTEM: 'bafk2bzacedakk5nofebyup4m7nvx6djksfwhnxzrfuq4oyemhpl4lllaikr64',
	INIT: 'bafk2bzacedhjh6oqgu3mxfge53s5a5kz7kh66m7do4oukbxc7gv5nwqj2hw7g',
	CRON: 'bafk2bzacebpewdvvgt6tk2o2u4rcovdgym67tadiis5usemlbejg7k3kt567o',
	ACCOUNT: 'bafk2bzacec5cdbj4lgn6szf4bh5a4myzpxr2fuwfp5a3nfewk3kjgxwmqgmwi',
	POWER: 'bafk2bzaceckxagvg2rq5ldvy2xnpvvq7iwkekhwrfhnqn67a64a2olygchbcs',
	MINER: 'bafk2bzacebxikkni3wowxmgp5jeh7vpnx5jxxiakfrdk2r2gyckq7v5nax4ie',
	MARKET: 'bafk2bzacebn7bopdnvfvhawz62uy6bznmq7fwp2wy7o4ru3wd2aedqxqswpxe',
	PAYCH: 'bafk2bzacebfxqrpf4v7hh7lqpoxjpz6jy7lluuxegsrv3k3qupnqcp2s7qxdi',
	MULTISIG: 'bafk2bzacealbxwd2rq2u3xk3nxwq4z3gxrh5sqy62q7v2l4nd6h7jhj5mkmza',
	REWARD: 'bafk2bzacedbeqgazmx4g7v4nsgo3hzmkxefqezej6pve22rbm5ra3ulxzjwf4',
	VERIFREG: 'bafk2bzacecdsyxqm2ih5lj3dzq2hl7byfzwdwz4wo4dcftsv5l3yd3qnflfm4',
	DATACAP: 'bafk2bzacebxzl4ur3nbxpn6wjbixsbu4v6qkeozxc4x7x4cq5d63xdmkc35jq',
	PLACEHOLDER: 'bafk2bzacedfvut2myeleyq67fljcrw4kkmn5pb5dpyozovj7jpoez5irnc3ro',
	EVM: 'bafk2bzacebvfpdmxdqm4j4nt7ti2uu2rqfhnvr67ljsyewh6iys7lj3xk5myy',
	EAM: 'bafk2bzacea3qv5e4q5p7il5bnfthps3v6d3g3bk3hd2b2x5ilxy6hx3kwf6nu',
	ETHACCOUNT: 'bafk2bzaceajuc2ihbotqt4qptmhxl4s6ghjrwmqf4tqhddq65w5qzp7tqwgny',
} as const;

/**
 * Method numbers for common actor methods
 * Used when invoking actor methods directly
 */
export const ACTOR_METHODS = {
	// Universal methods
	CONSTRUCTOR: 1,
	
	// Account actor
	ACCOUNT_PUBKEY_ADDRESS: 2,
	
	// Init actor
	INIT_EXEC: 2,
	INIT_EXEC4: 3,
	
	// Miner actor
	MINER_CONTROL_ADDRESSES: 2,
	MINER_CHANGE_WORKER_ADDRESS: 3,
	MINER_CHANGE_PEER_ID: 4,
	MINER_SUBMIT_WINDOWED_POST: 5,
	MINER_PRE_COMMIT_SECTOR: 6,
	MINER_PROVE_COMMIT_SECTOR: 7,
	MINER_EXTEND_SECTOR_EXPIRATION: 8,
	MINER_TERMINATE_SECTORS: 9,
	MINER_DECLARE_FAULTS: 10,
	MINER_DECLARE_FAULTS_RECOVERED: 11,
	MINER_ON_DEFERRED_CRON_EVENT: 12,
	MINER_CHECK_SECTOR_PROVEN: 13,
	MINER_APPLY_REWARDS: 14,
	MINER_REPORT_CONSENSUS_FAULT: 15,
	MINER_WITHDRAW_BALANCE: 16,
	MINER_CONFIRM_SECTOR_PROOFS_VALID: 17,
	MINER_CHANGE_MULTIADDRS: 18,
	MINER_COMPACT_PARTITIONS: 19,
	MINER_COMPACT_SECTOR_NUMBERS: 20,
	MINER_CONFIRM_UPDATE_WORKER_KEY: 21,
	MINER_REPAY_DEBT: 22,
	MINER_CHANGE_OWNER_ADDRESS: 23,
	MINER_DISPUTE_WINDOWED_POST: 24,
	MINER_PRE_COMMIT_SECTOR_BATCH: 25,
	MINER_PROVE_COMMIT_AGGREGATE: 26,
	MINER_PROVE_REPLICA_UPDATES: 27,
	
	// Market actor
	MARKET_ADD_BALANCE: 2,
	MARKET_WITHDRAW_BALANCE: 3,
	MARKET_PUBLISH_STORAGE_DEALS: 4,
	MARKET_VERIFY_DEALS_FOR_ACTIVATION: 5,
	MARKET_ACTIVATE_DEALS: 6,
	MARKET_ON_MINER_SECTORS_TERMINATE: 7,
	MARKET_COMPUTE_DATA_COMMITMENT: 8,
	MARKET_CRON_TICK: 9,
	
	// Power actor
	POWER_CREATE_MINER: 2,
	POWER_UPDATE_CLAIMED_POWER: 3,
	POWER_ENROLL_CRON_EVENT: 4,
	POWER_CRON_TICK: 5,
	POWER_UPDATE_PLEDGE_TOTAL: 6,
	POWER_SUBMIT_POREP_FOR_BULK_VERIFY: 8,
	POWER_CURRENT_TOTAL_POWER: 9,
	
	// Verified registry actor
	VERIFREG_ADD_VERIFIER: 2,
	VERIFREG_REMOVE_VERIFIER: 3,
	VERIFREG_ADD_VERIFIED_CLIENT: 4,
	VERIFREG_USE_BYTES: 5,
	VERIFREG_RESTORE_BYTES: 6,
	VERIFREG_REMOVE_VERIFIED_CLIENT_DATA_CAP: 7,
	
	// DataCap actor
	DATACAP_MINT: 2,
	DATACAP_DESTROY: 3,
	DATACAP_NAME: 4,
	DATACAP_SYMBOL: 5,
	DATACAP_TOTAL_SUPPLY: 6,
	DATACAP_BALANCE_OF: 7,
	DATACAP_TRANSFER: 8,
	DATACAP_TRANSFER_FROM: 9,
	DATACAP_INCREASE_ALLOWANCE: 10,
	DATACAP_DECREASE_ALLOWANCE: 11,
	DATACAP_REVOKE_ALLOWANCE: 12,
	DATACAP_BURN: 13,
	DATACAP_BURN_FROM: 14,
	DATACAP_ALLOWANCE: 15,
	
	// Multisig actor
	MULTISIG_PROPOSE: 2,
	MULTISIG_APPROVE: 3,
	MULTISIG_CANCEL: 4,
	MULTISIG_ADD_SIGNER: 5,
	MULTISIG_REMOVE_SIGNER: 6,
	MULTISIG_SWAP_SIGNER: 7,
	MULTISIG_CHANGE_NUM_APPROVALS_THRESHOLD: 8,
	MULTISIG_LOCK_BALANCE: 9,
	
	// Payment channel actor
	PAYCH_CONSTRUCTOR: 1,
	PAYCH_UPDATE_CHANNEL_STATE: 2,
	PAYCH_SETTLE: 3,
	PAYCH_COLLECT: 4,
} as const;

/**
 * Exit codes for actor method execution
 */
export const EXIT_CODES = {
	OK: 0,
	SYS_SENDER_INVALID: 1,
	SYS_SENDER_STATE_INVALID: 2,
	SYS_ILLEGAL_INSTRUCTION: 3,
	SYS_INVALID_RECEIVER: 4,
	SYS_INSUFFICIENT_FUNDS: 5,
	SYS_OUT_OF_GAS: 6,
	SYS_ILLEGAL_EXIT_CODE: 7,
	SYS_ASSERTION_FAILED: 8,
	SYS_MISSING_RETURN: 9,
	USR_ILLEGAL_ARGUMENT: 16,
	USR_NOT_FOUND: 17,
	USR_FORBIDDEN: 18,
	USR_INSUFFICIENT_FUNDS: 19,
	USR_ILLEGAL_STATE: 20,
	USR_SERIALIZATION: 21,
	USR_UNHANDLED_MESSAGE: 22,
	USR_UNSPECIFIED: 23,
	USR_ASSERTION_FAILED: 24,
} as const;
