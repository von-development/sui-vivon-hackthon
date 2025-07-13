// =============================================================================
// VIVON Sui Smart Contract Integration Service
// =============================================================================

import { Transaction } from "@mysten/sui/transactions";
import { 
  FUNCTION_TARGETS, 
  STRUCT_TYPE_TARGETS, 
  EVENT_TYPE_TARGETS, 
  TOKEN_CONSTANTS,
  getPackageId 
} from "@/constants/contractConstants";
import DexService from "./dexService";

// Types for the client - these will be provided by the dapp-kit hook
type SuiClient = any;
type SuiTransactionBlockResponse = any;

// =============================================================================
// Types
// =============================================================================

export interface VivonTokenInfo {
  balance: string;
  totalSupply: string;
  decimals: number;
  symbol: string;
  name: string;
}

export interface BountyPool {
  id: string;
  balance: string;
  attemptFee: string;
  specUri: string;
  oracleCapId: string;
  submissionCount: number;
  created: string;
  title?: string;
  description?: string;
}

export interface Submission {
  id: string;
  poolId: string;
  hunter: string;
  hash: string;
  status: number; // 0 = pending, 1 = win
  timestamp: string;
}

export interface VivonNFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: Record<string, any>;
  owner: string;
  editionNumber: number;
  maxSupply: number;
}

export interface WinnerBadge {
  id: string;
  bountyId: string;
  winner: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface LockedTokens {
  id: string;
  balance: string;
  unlockDate: string;
  owner: string;
}

// =============================================================================
// VIVON Token Service
// =============================================================================

export class VivonTokenService {
  constructor(private client: SuiClient, private network: string = "testnet") {}

  /**
   * Get VIVON token balance for an address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.client.getBalance({
        owner: address,
        coinType: STRUCT_TYPE_TARGETS.VIVON_TOKEN(this.network),
      });
      return balance.totalBalance;
    } catch (error) {
      console.error("Error getting VIVON balance:", error);
      throw error;
    }
  }

  /**
   * Get all VIVON coins owned by an address
   */
  async getCoins(address: string, cursor?: string, limit: number = 10) {
    try {
      return await this.client.getCoins({
        owner: address,
        coinType: STRUCT_TYPE_TARGETS.VIVON_TOKEN(this.network),
        cursor,
        limit,
      });
    } catch (error) {
      console.error("Error getting VIVON coins:", error);
      throw error;
    }
  }

  /**
   * Create a transaction to transfer VIVON tokens
   */
  createTransferTransaction(
    from: string,
    to: string,
    amount: string,
  ): Transaction {
    const tx = new Transaction();
    tx.setSender(from);

    // Convert amount to smallest unit - handle decimal values
    const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * (10 ** TOKEN_CONSTANTS.VIVON.DECIMALS)));

    tx.moveCall({
      target: FUNCTION_TARGETS.VIVON.TRANSFER(this.network),
      arguments: [
        tx.pure.address(to),
        tx.pure.u64(amountInSmallestUnit.toString()),
      ],
    });

    return tx;
  }

  /**
   * Create a transaction to lock VIVON tokens
   */
  createLockTransaction(
    owner: string,
    amount: string,
    unlockDate: string,
  ): Transaction {
    const tx = new Transaction();
    tx.setSender(owner);

    const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * (10 ** TOKEN_CONSTANTS.VIVON.DECIMALS)));
    const unlockTimestamp = new Date(unlockDate).getTime();

    tx.moveCall({
      target: FUNCTION_TARGETS.VIVON.LOCK(this.network),
      arguments: [
        tx.pure.u64(amountInSmallestUnit.toString()),
        tx.pure.u64(unlockTimestamp.toString()),
      ],
    });

    return tx;
  }

  /**
   * Create a transaction to unlock VIVON tokens
   */
  createUnlockTransaction(owner: string, lockerId: string): Transaction {
    const tx = new Transaction();
    tx.setSender(owner);

    tx.moveCall({
      target: FUNCTION_TARGETS.VIVON.UNLOCK(this.network),
      arguments: [tx.object(lockerId)],
    });

    return tx;
  }

  /**
   * Get locked tokens for an address
   */
  async getLockedTokens(address: string): Promise<LockedTokens[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: STRUCT_TYPE_TARGETS.LOCKER(this.network),
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return objects.data.map((obj: any) => ({
        id: obj.data.objectId,
        balance: obj.data.content.fields.balance,
        unlockDate: obj.data.content.fields.unlock_date,
        owner: address,
      }));
    } catch (error) {
      console.error("Error getting locked tokens:", error);
      throw error;
    }
  }
}

// =============================================================================
// Bounty Service
// =============================================================================

export class BountyService {
  constructor(private client: SuiClient, private network: string = "testnet") {}

  /**
   * Get all bounty pools from events
   */
  async getBountyPools(limit: number = 50): Promise<BountyPool[]> {
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: EVENT_TYPE_TARGETS.BOUNTY.POOL_CREATED(this.network),
        },
        limit,
        order: "descending",
      });

      const bountyPools: BountyPool[] = [];
      for (const event of events.data) {
        const poolId = event.parsedJson?.pool_id;
        if (poolId) {
          const pool = await this.getBountyPool(poolId);
          if (pool) {
            bountyPools.push(pool);
          }
        }
      }

      return bountyPools;
    } catch (error) {
      console.error("Error getting bounty pools:", error);
      throw error;
    }
  }

  /**
   * Get a specific bounty pool
   */
  async getBountyPool(poolId: string): Promise<BountyPool | null> {
    try {
      const object = await this.client.getObject({
        id: poolId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!object.data?.content || object.data.content.dataType !== "moveObject") {
        return null;
      }

      const fields = object.data.content.fields as any;
      
      // Extract balance value properly
      let balance = "0";
      if (fields.balance) {
        if (typeof fields.balance === 'object' && fields.balance.fields) {
          balance = fields.balance.fields.value || fields.balance.fields.balance || "0";
        } else if (typeof fields.balance === 'object' && fields.balance.value) {
          balance = fields.balance.value;
        } else if (typeof fields.balance === 'string' || typeof fields.balance === 'number') {
          balance = fields.balance.toString();
        }
      }
      
      // Extract attempt fee properly
      let attemptFee = "0";
      if (fields.attempt_fee) {
        if (typeof fields.attempt_fee === 'object' && fields.attempt_fee.value) {
          attemptFee = fields.attempt_fee.value;
        } else if (typeof fields.attempt_fee === 'string' || typeof fields.attempt_fee === 'number') {
          attemptFee = fields.attempt_fee.toString();
        }
      }
      
      return {
        id: poolId,
        balance: balance,
        attemptFee: attemptFee,
        specUri: fields.spec_uri || "",
        oracleCapId: fields.oracle_cap_id || "",
        submissionCount: 0, // TODO: Count submissions
        created: new Date().toISOString(), // TODO: Get from creation event
      };
    } catch (error) {
      console.error("Error getting bounty pool:", error);
      return null;
    }
  }

  /**
   * Create a transaction to create a bounty pool
   */
  createBountyPoolTransaction(
    creator: string,
    initialFunding: string,
    attemptFee: string,
    specUri: string,
  ): Transaction {
    const tx = new Transaction();
    tx.setSender(creator);

    // Convert to MIST (SUI's smallest unit) - handle decimal values
    const initialFundingMist = BigInt(Math.floor(parseFloat(initialFunding) * (10 ** TOKEN_CONSTANTS.SUI.DECIMALS)));
    const attemptFeeMist = BigInt(Math.floor(parseFloat(attemptFee) * (10 ** TOKEN_CONSTANTS.SUI.DECIMALS)));

    // Split coins for initial funding
    const [coin] = tx.splitCoins(tx.gas, [initialFundingMist.toString()]);

    tx.moveCall({
      target: FUNCTION_TARGETS.BOUNTY.CREATE_POOL(this.network),
      arguments: [
        coin,
        tx.pure.u64(attemptFeeMist.toString()),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(specUri))),
      ],
    });

    return tx;
  }

  /**
   * Create a transaction to submit to a bounty pool
   */
  createSubmissionTransaction(
    hunter: string,
    poolId: string,
    submissionHash: string,
    attemptFee: string,
  ): Transaction {
    const tx = new Transaction();
    tx.setSender(hunter);

    const attemptFeeMist = BigInt(Math.floor(parseFloat(attemptFee) * (10 ** TOKEN_CONSTANTS.SUI.DECIMALS)));
    const [coin] = tx.splitCoins(tx.gas, [attemptFeeMist.toString()]);

    // Convert hash string to bytes
    const hashBytes = Array.from(new TextEncoder().encode(submissionHash));

    tx.moveCall({
      target: FUNCTION_TARGETS.BOUNTY.SUBMIT(this.network),
      arguments: [
        tx.object(poolId),
        tx.pure.vector("u8", hashBytes),
        coin,
      ],
    });

    return tx;
  }

  /**
   * Get submissions for a bounty pool
   */
  async getSubmissions(poolId: string): Promise<Submission[]> {
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: EVENT_TYPE_TARGETS.BOUNTY.SUBMITTED(this.network),
        },
        limit: 100,
        order: "descending",
      });

      const submissions: Submission[] = [];
      for (const event of events.data) {
        const data = event.parsedJson;
        if (data?.pool_id === poolId) {
          const submissionId = data.submission_id;
          const submission = await this.getSubmission(submissionId);
          if (submission) {
            submissions.push(submission);
          }
        }
      }

      return submissions;
    } catch (error) {
      console.error("Error getting submissions:", error);
      throw error;
    }
  }

  /**
   * Get a specific submission
   */
  async getSubmission(submissionId: string): Promise<Submission | null> {
    try {
      const object = await this.client.getObject({
        id: submissionId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!object.data?.content || object.data.content.dataType !== "moveObject") {
        return null;
      }

      const fields = object.data.content.fields as any;
      return {
        id: submissionId,
        poolId: fields.pool_id,
        hunter: fields.hunter,
        hash: fields.hash,
        status: fields.status,
        timestamp: new Date().toISOString(), // TODO: Get from event
      };
    } catch (error) {
      console.error("Error getting submission:", error);
      return null;
    }
  }
}

// =============================================================================
// NFT Service
// =============================================================================

export class NFTService {
  constructor(private client: SuiClient, private network: string = "testnet") {}

  /**
   * Get NFTs owned by an address
   */
  async getNFTs(address: string): Promise<VivonNFT[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: STRUCT_TYPE_TARGETS.VIVON_NFT(this.network),
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return objects.data.map((obj: any) => ({
        id: obj.data.objectId,
        name: obj.data.content.fields.name,
        description: obj.data.content.fields.description,
        imageUrl: obj.data.content.fields.image_url,
        attributes: obj.data.content.fields.attributes,
        owner: address,
        editionNumber: obj.data.content.fields.edition_number,
        maxSupply: obj.data.content.fields.max_supply,
      }));
    } catch (error) {
      console.error("Error getting NFTs:", error);
      throw error;
    }
  }

  /**
   * Create a transaction to mint an NFT
   */
  createMintTransaction(
    recipient: string,
    name: string,
    description: string,
    imageUrl: string,
    attributes: Record<string, any>,
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: FUNCTION_TARGETS.NFT.MINT(this.network),
      arguments: [
        tx.pure.address(recipient),
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(imageUrl),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(JSON.stringify(attributes)))),
      ],
    });

    return tx;
  }

  /**
   * Create a transaction to transfer an NFT
   */
  createTransferTransaction(
    from: string,
    to: string,
    nftId: string,
  ): Transaction {
    const tx = new Transaction();
    tx.setSender(from);

    tx.moveCall({
      target: FUNCTION_TARGETS.NFT.TRANSFER(this.network),
      arguments: [
        tx.object(nftId),
        tx.pure.address(to),
      ],
    });

    return tx;
  }
}

// =============================================================================
// Badge Service
// =============================================================================

export class BadgeService {
  constructor(private client: SuiClient, private network: string = "testnet") {}

  /**
   * Get badges owned by an address
   */
  async getBadges(address: string): Promise<WinnerBadge[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: STRUCT_TYPE_TARGETS.WINNER_BADGE(this.network),
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return objects.data.map((obj: any) => ({
        id: obj.data.objectId,
        bountyId: obj.data.content.fields.bounty_id,
        winner: address,
        timestamp: obj.data.content.fields.timestamp,
        metadata: obj.data.content.fields.metadata,
      }));
    } catch (error) {
      console.error("Error getting badges:", error);
      throw error;
    }
  }

  /**
   * Create a transaction to mint a badge
   */
  createMintTransaction(
    recipient: string,
    bountyId: string,
    metadata: Record<string, any>,
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: FUNCTION_TARGETS.BADGE.MINT(this.network),
      arguments: [
        tx.pure.address(recipient),
        tx.pure.string(bountyId),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(JSON.stringify(metadata)))),
      ],
    });

    return tx;
  }
}

// =============================================================================
// Main Sui Service
// =============================================================================

export class SuiService {
  public vivonToken: VivonTokenService;
  public bounty: BountyService;
  public nft: NFTService;
  public badge: BadgeService;
  public dex: DexService;

  constructor(
    private client: SuiClient,
    private network: string = "testnet",
  ) {
    this.vivonToken = new VivonTokenService(client, network);
    this.bounty = new BountyService(client, network);
    this.nft = new NFTService(client, network);
    this.badge = new BadgeService(client, network);
    this.dex = new DexService(client, network);
  }

  /**
   * Switch to a different network
   */
  switchNetwork(newNetwork: string) {
    this.network = newNetwork;
    this.vivonToken = new VivonTokenService(this.client, newNetwork);
    this.bounty = new BountyService(this.client, newNetwork);
    this.nft = new NFTService(this.client, newNetwork);
    this.badge = new BadgeService(this.client, newNetwork);
    this.dex = new DexService(this.client, newNetwork);
  }

  /**
   * Execute a transaction and wait for confirmation
   */
  async executeTransaction(
    transaction: Transaction,
    signer: any,
  ): Promise<any> {
    try {
      // Execute transaction using the current dapp-kit API
      const result = await signer({
        transaction,
      });

      console.log("Raw transaction result:", result);
      
      // Handle different possible result structures
      const digest = result?.digest || result?.transactionDigest || result?.txDigest;
      const effects = result?.effects || result?.rawEffects;
      const events = result?.events;
      const objectChanges = result?.objectChanges;
      const balanceChanges = result?.balanceChanges;
      
      // Return in the expected format
      return {
        success: true,
        digest,
        effects,
        events,
        objectChanges,
        balanceChanges,
        rawResult: result, // Include raw result for debugging
      };
    } catch (error) {
      console.error("Error executing transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address: string, limit: number = 20) {
    try {
      return await this.client.queryTransactionBlocks({
        filter: {
          FromOrToAddress: { addr: address },
        },
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
        limit,
        order: "descending",
      });
    } catch (error) {
      console.error("Error getting transaction history:", error);
      throw error;
    }
  }

  /**
   * Get user's dashboard data
   */
  async getDashboardData(address: string) {
    try {
      const [
        suiBalance,
        vivonBalance,
        lockedTokens,
        nfts,
        badges,
        transactionHistory,
      ] = await Promise.all([
        this.client.getBalance({ owner: address }),
        this.vivonToken.getBalance(address),
        this.vivonToken.getLockedTokens(address),
        this.nft.getNFTs(address),
        this.badge.getBadges(address),
        this.getTransactionHistory(address, 10),
      ]);

      return {
        suiBalance: suiBalance.totalBalance,
        vivonBalance,
        lockedTokens,
        nfts,
        badges,
        transactionHistory: transactionHistory.data,
        stats: {
          totalNFTs: nfts.length,
          totalBadges: badges.length,
          totalLockedVivon: lockedTokens.reduce((sum: bigint, lock: LockedTokens) => sum + BigInt(lock.balance), BigInt(0)).toString(),
          totalTransactions: transactionHistory.data.length,
        },
      };
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      throw error;
    }
  }
}

// =============================================================================
// Export default instance
// =============================================================================

export default SuiService; 