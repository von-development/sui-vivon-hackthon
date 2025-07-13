// =============================================================================
// VIVON Smart Contract Constants
// =============================================================================

// Package IDs for different networks
export const PACKAGE_IDS = {
  testnet: "0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7",
  mainnet: "", // Add when deployed to mainnet
  devnet: "", // Add when deployed to devnet
} as const;

// Get package ID based on current network
export const getPackageId = (network: string = "testnet"): string => {
  return PACKAGE_IDS[network as keyof typeof PACKAGE_IDS] || PACKAGE_IDS.testnet;
};

// Smart contract module and function names
export const MODULES = {
  VIVON: "vivon",
  BOUNTY: "bounty",
  NFT: "vivon_nft",
  BADGE: "badge",
} as const;

// VIVON Token Functions
export const VIVON_FUNCTIONS = {
  MINT: "mint",
  BURN: "burn",
  TRANSFER: "transfer",
  LOCK: "lock",
  UNLOCK: "unlock",
  GET_BALANCE: "get_balance",
  GET_TOTAL_SUPPLY: "get_total_supply",
} as const;

// Bounty Functions
export const BOUNTY_FUNCTIONS = {
  CREATE_POOL: "create_pool",
  SUBMIT: "submit",
  APPROVE_WIN: "approve_win",
  CLAIM_REWARD: "claim_reward",
  GET_POOL: "get_pool",
  GET_SUBMISSION: "get_submission",
} as const;

// NFT Functions
export const NFT_FUNCTIONS = {
  MINT: "mint",
  BURN: "burn",
  TRANSFER: "transfer",
  UPDATE_METADATA: "update_metadata",
  GET_METADATA: "get_metadata",
} as const;

// Badge Functions
export const BADGE_FUNCTIONS = {
  MINT: "mint",
  BURN: "burn",
  TRANSFER: "transfer",
  GET_BADGE: "get_badge",
} as const;

// Event Types
export const EVENT_TYPES = {
  BOUNTY: {
    POOL_CREATED: "PoolCreated",
    SUBMITTED: "Submitted",
    SUCCESS: "Success",
  },
  VIVON: {
    MINTED: "Minted",
    BURNED: "Burned",
    LOCKED: "Locked",
    UNLOCKED: "Unlocked",
  },
  NFT: {
    MINTED: "Minted",
    BURNED: "Burned",
    TRANSFERRED: "Transferred",
  },
  BADGE: {
    MINTED: "Minted",
    BURNED: "Burned",
    TRANSFERRED: "Transferred",
  },
} as const;

// Struct Types
export const STRUCT_TYPES = {
  BOUNTY_POOL: "BountyPool",
  SUBMISSION: "Submission",
  ORACLE_CAP: "OracleCap",
  VIVON_TOKEN: "VIVON",
  VIVON_NFT: "VivonNFT",
  WINNER_BADGE: "WinnerBadge",
  MINT_CAPABILITY: "MintCapability",
  LOCKER: "Locker",
} as const;

// Token Constants
export const TOKEN_CONSTANTS = {
  VIVON: {
    DECIMALS: 9,
    SYMBOL: "VIVON",
    NAME: "VIVON",
    TOTAL_SUPPLY: 10_000_000_000_000_000, // 10 million VIVON
    INITIAL_SUPPLY: 8_000_000_000_000_000, // 8 million VIVON
  },
  SUI: {
    DECIMALS: 9,
    SYMBOL: "SUI",
    NAME: "SUI",
  },
} as const;

// Build function target strings
export const buildFunctionTarget = (module: string, func: string, network: string = "testnet"): string => {
  return `${getPackageId(network)}::${module}::${func}`;
};

// Build struct type strings
export const buildStructType = (module: string, struct: string, network: string = "testnet"): string => {
  return `${getPackageId(network)}::${module}::${struct}`;
};

// Build event type strings
export const buildEventType = (module: string, event: string, network: string = "testnet"): string => {
  return `${getPackageId(network)}::${module}::${event}`;
};

// Common function targets (pre-built for convenience)
export const FUNCTION_TARGETS = {
  BOUNTY: {
    CREATE_POOL: (network?: string) => buildFunctionTarget(MODULES.BOUNTY, BOUNTY_FUNCTIONS.CREATE_POOL, network),
    SUBMIT: (network?: string) => buildFunctionTarget(MODULES.BOUNTY, BOUNTY_FUNCTIONS.SUBMIT, network),
    APPROVE_WIN: (network?: string) => buildFunctionTarget(MODULES.BOUNTY, BOUNTY_FUNCTIONS.APPROVE_WIN, network),
    CLAIM_REWARD: (network?: string) => buildFunctionTarget(MODULES.BOUNTY, BOUNTY_FUNCTIONS.CLAIM_REWARD, network),
  },
  VIVON: {
    MINT: (network?: string) => buildFunctionTarget(MODULES.VIVON, VIVON_FUNCTIONS.MINT, network),
    BURN: (network?: string) => buildFunctionTarget(MODULES.VIVON, VIVON_FUNCTIONS.BURN, network),
    TRANSFER: (network?: string) => buildFunctionTarget(MODULES.VIVON, VIVON_FUNCTIONS.TRANSFER, network),
    LOCK: (network?: string) => buildFunctionTarget(MODULES.VIVON, VIVON_FUNCTIONS.LOCK, network),
    UNLOCK: (network?: string) => buildFunctionTarget(MODULES.VIVON, VIVON_FUNCTIONS.UNLOCK, network),
  },
  NFT: {
    MINT: (network?: string) => buildFunctionTarget(MODULES.NFT, NFT_FUNCTIONS.MINT, network),
    BURN: (network?: string) => buildFunctionTarget(MODULES.NFT, NFT_FUNCTIONS.BURN, network),
    TRANSFER: (network?: string) => buildFunctionTarget(MODULES.NFT, NFT_FUNCTIONS.TRANSFER, network),
  },
  BADGE: {
    MINT: (network?: string) => buildFunctionTarget(MODULES.BADGE, BADGE_FUNCTIONS.MINT, network),
    BURN: (network?: string) => buildFunctionTarget(MODULES.BADGE, BADGE_FUNCTIONS.BURN, network),
    TRANSFER: (network?: string) => buildFunctionTarget(MODULES.BADGE, BADGE_FUNCTIONS.TRANSFER, network),
  },
} as const;

// Common struct types (pre-built for convenience)
export const STRUCT_TYPE_TARGETS = {
  BOUNTY_POOL: (network?: string) => buildStructType(MODULES.BOUNTY, STRUCT_TYPES.BOUNTY_POOL, network),
  SUBMISSION: (network?: string) => buildStructType(MODULES.BOUNTY, STRUCT_TYPES.SUBMISSION, network),
  ORACLE_CAP: (network?: string) => buildStructType(MODULES.BOUNTY, STRUCT_TYPES.ORACLE_CAP, network),
  VIVON_TOKEN: (network?: string) => buildStructType(MODULES.VIVON, STRUCT_TYPES.VIVON_TOKEN, network),
  VIVON_NFT: (network?: string) => buildStructType(MODULES.NFT, STRUCT_TYPES.VIVON_NFT, network),
  WINNER_BADGE: (network?: string) => buildStructType(MODULES.BADGE, STRUCT_TYPES.WINNER_BADGE, network),
  MINT_CAPABILITY: (network?: string) => buildStructType(MODULES.VIVON, STRUCT_TYPES.MINT_CAPABILITY, network),
  LOCKER: (network?: string) => buildStructType(MODULES.VIVON, STRUCT_TYPES.LOCKER, network),
} as const;

// Common event types (pre-built for convenience)
export const EVENT_TYPE_TARGETS = {
  BOUNTY: {
    POOL_CREATED: (network?: string) => buildEventType(MODULES.BOUNTY, EVENT_TYPES.BOUNTY.POOL_CREATED, network),
    SUBMITTED: (network?: string) => buildEventType(MODULES.BOUNTY, EVENT_TYPES.BOUNTY.SUBMITTED, network),
    SUCCESS: (network?: string) => buildEventType(MODULES.BOUNTY, EVENT_TYPES.BOUNTY.SUCCESS, network),
  },
  VIVON: {
    MINTED: (network?: string) => buildEventType(MODULES.VIVON, EVENT_TYPES.VIVON.MINTED, network),
    BURNED: (network?: string) => buildEventType(MODULES.VIVON, EVENT_TYPES.VIVON.BURNED, network),
    LOCKED: (network?: string) => buildEventType(MODULES.VIVON, EVENT_TYPES.VIVON.LOCKED, network),
    UNLOCKED: (network?: string) => buildEventType(MODULES.VIVON, EVENT_TYPES.VIVON.UNLOCKED, network),
  },
  NFT: {
    MINTED: (network?: string) => buildEventType(MODULES.NFT, EVENT_TYPES.NFT.MINTED, network),
    BURNED: (network?: string) => buildEventType(MODULES.NFT, EVENT_TYPES.NFT.BURNED, network),
    TRANSFERRED: (network?: string) => buildEventType(MODULES.NFT, EVENT_TYPES.NFT.TRANSFERRED, network),
  },
  BADGE: {
    MINTED: (network?: string) => buildEventType(MODULES.BADGE, EVENT_TYPES.BADGE.MINTED, network),
    BURNED: (network?: string) => buildEventType(MODULES.BADGE, EVENT_TYPES.BADGE.BURNED, network),
    TRANSFERRED: (network?: string) => buildEventType(MODULES.BADGE, EVENT_TYPES.BADGE.TRANSFERRED, network),
  },
} as const;

// Export default for convenience
export default {
  PACKAGE_IDS,
  getPackageId,
  MODULES,
  FUNCTION_TARGETS,
  STRUCT_TYPE_TARGETS,
  EVENT_TYPE_TARGETS,
  TOKEN_CONSTANTS,
  buildFunctionTarget,
  buildStructType,
  buildEventType,
}; 