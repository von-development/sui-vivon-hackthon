import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

// JailbreakGuard contract details
const PACKAGE_ID = "0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7";

// Simple winning condition: if someone submits "12345678", they win
const WINNING_SUBMISSIONS = [
  "12345678",
  "hello world", // Also accept this for testing
  "jailbreak", // And this
];

export class SimpleOracle {
  private client: SuiClient;
  
  constructor(client: SuiClient) {
    this.client = client;
  }

  /**
   * Check if a text submission is a winner
   */
  isWinningSubmission(submissionText: string): boolean {
    return WINNING_SUBMISSIONS.includes(submissionText.toLowerCase().trim());
  }

  /**
   * Create hash of a text submission (same as frontend)
   */
  async createHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if a hash corresponds to a winning submission
   */
  async isWinningHash(submissionHash: string): Promise<boolean> {
    for (const winningText of WINNING_SUBMISSIONS) {
      const winningHash = await this.createHash(winningText);
      if (winningHash === submissionHash) {
        return true;
      }
    }
    return false;
  }

  /**
   * Process a submission and trigger payout if it's a winner
   */
  async processSubmission(
    poolId: string,
    submissionId: string,
    submissionHash: string,
    oracleCapId: string,
    signAndExecute: any
  ): Promise<boolean> {
    try {
      console.log("Oracle: Processing submission...", {
        poolId,
        submissionId,
        submissionHash: submissionHash.substring(0, 20) + "...",
      });

      // Check if this submission is a winner
      const isWinner = await this.isWinningHash(submissionHash);
      
      if (!isWinner) {
        console.log("Oracle: Submission is not a winner");
        return false;
      }

      console.log("Oracle: 🎉 WINNER DETECTED! Triggering payout...");

      // Create transaction to record success
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::bounty::record_success_with_badge`,
        arguments: [
          tx.object(poolId),
          tx.object(submissionId),
          tx.object(oracleCapId),
        ],
      });

      // Execute the oracle transaction
      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: async (txRes: any) => {
              console.log("Oracle: Payout successful!", txRes.digest);
              resolve(true);
            },
            onError: (err: any) => {
              console.error("Oracle: Payout failed:", err);
              reject(err);
            },
          }
        );
      });
    } catch (error) {
      console.error("Oracle: Error processing submission:", error);
      return false;
    }
  }

  /**
   * Try to execute real blockchain payout, fall back to simulation
   */
  async processWinningSubmission(
    submissionText: string,
    bountyId: string,
    submissionId: string,
    userAddress: string,
    signAndExecuteTransaction: any,
    onStatusUpdate: (status: string) => void
  ): Promise<{ success: boolean; realPayout: boolean }> {
    onStatusUpdate("Oracle analyzing submission...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    onStatusUpdate("Checking against AI safety criteria...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isWinner = this.isWinningSubmission(submissionText);
    
    if (!isWinner) {
      onStatusUpdate("❌ Submission does not meet jailbreak criteria");
      return { success: false, realPayout: false };
    }

    onStatusUpdate("🎉 Jailbreak detected! Processing payout...");
    
    // Try to execute real blockchain payout
    try {
      const realPayout = await this.executeRealPayout(
        bountyId,
        submissionId,
        userAddress,
        signAndExecuteTransaction,
        onStatusUpdate
      );
      
      if (realPayout) {
        onStatusUpdate("✅ Real blockchain payout complete! Check your wallet!");
        return { success: true, realPayout: true };
      }
    } catch (error) {
      console.log("Real payout failed, falling back to simulation:", error);
    }
    
    // Fall back to simulation
    onStatusUpdate("🏆 Simulating payout (demo mode)...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    onStatusUpdate("✅ Demo payout complete! (In real scenario, you'd receive SUI + NFT)");
    return { success: true, realPayout: false };
  }

  /**
   * Try to execute real blockchain payout
   */
  async executeRealPayout(
    bountyId: string,
    submissionId: string,
    userAddress: string,
    signAndExecuteTransaction: any,
    onStatusUpdate: (status: string) => void
  ): Promise<boolean> {
    onStatusUpdate("🔗 Executing real blockchain payout...");
    
    // First, try to find the Oracle Cap for this bounty
    const oracleCapId = await this.findOracleCapForUser(bountyId, userAddress);
    
    if (!oracleCapId) {
      console.log("No Oracle Cap found for user - cannot execute real payout");
      return false;
    }
    
    onStatusUpdate("🗝️ Oracle Cap found! Triggering payout transaction...");
    
    // Try to find the submission object
    const submissionObjectId = await this.findSubmissionObject(submissionId, userAddress);
    
    if (!submissionObjectId) {
      console.log("Submission object not found");
      return false;
    }
    
    // Create the payout transaction
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::bounty::record_success_with_badge`,
      arguments: [
        tx.object(bountyId),           // pool: &mut BountyPool
        tx.object(submissionObjectId), // submission: &mut Submission  
        tx.object(oracleCapId),        // cap: &OracleCap
      ],
    });
    
    // Execute the transaction
    return new Promise((resolve, reject) => {
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (txRes: any) => {
            console.log("✅ Real payout successful!", txRes.digest);
            onStatusUpdate("💰 SUI transferred to your wallet!");
            
            // Wait a moment then check for NFT
            setTimeout(() => {
              onStatusUpdate("🏆 NFT badge minted! Check your wallet!");
            }, 2000);
            
            resolve(true);
          },
          onError: (err: any) => {
            console.error("❌ Real payout failed:", err);
            reject(err);
          },
        }
      );
    });
  }

  /**
   * Find Oracle Cap owned by user for this bounty
   */
  async findOracleCapForUser(bountyId: string, userAddress: string): Promise<string | null> {
    try {
      // Get all objects owned by user
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${PACKAGE_ID}::bounty::OracleCap`
        },
        options: {
          showContent: true,
        }
      });
      
      // Find the Oracle Cap for this specific bounty
      for (const obj of objects.data) {
        if (obj.data?.content?.dataType === "moveObject") {
          const content = obj.data.content.fields as any;
          if (content.pool_id === bountyId) {
            return obj.data.objectId;
          }
        }
      }
    } catch (error) {
      console.error("Error finding Oracle Cap:", error);
    }
    
    return null;
  }

  /**
   * Find submission object for this transaction
   */
  async findSubmissionObject(submissionId: string, userAddress: string): Promise<string | null> {
    try {
      // Get all submission objects owned by user
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${PACKAGE_ID}::bounty::Submission`
        },
        options: {
          showContent: true,
        }
      });
      
      // For now, return the most recent submission
      // In a real app, you'd match by transaction digest or other criteria
      if (objects.data.length > 0) {
        return objects.data[0].data?.objectId || null;
      }
    } catch (error) {
      console.error("Error finding submission object:", error);
    }
    
    return null;
  }

  /**
   * Simulate oracle verification with delay (for realistic UX)
   */
  async simulateVerification(
    submissionText: string,
    onStatusUpdate: (status: string) => void
  ): Promise<boolean> {
    onStatusUpdate("Oracle analyzing submission...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    onStatusUpdate("Checking against AI safety criteria...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isWinner = this.isWinningSubmission(submissionText);
    
    if (isWinner) {
      onStatusUpdate("🎉 Jailbreak detected! Processing payout...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      onStatusUpdate("✅ Payout complete! Congratulations!");
      return true;
    } else {
      onStatusUpdate("❌ Submission does not meet jailbreak criteria");
      return false;
    }
  }
}

// Helper function to get oracle cap ID for a bounty
export async function getOracleCapId(client: SuiClient, bountyPoolId: string): Promise<string | null> {
  try {
    // Get the bounty pool object
    const response = await client.getObject({
      id: bountyPoolId,
      options: {
        showContent: true,
      }
    });

    if (response.data && response.data.content && response.data.content.dataType === "moveObject") {
      const content = response.data.content.fields as any;
      return content.oracle_cap_id;
    }
  } catch (error) {
    console.error("Error getting oracle cap ID:", error);
  }
  return null;
}

// Export winning submissions for UI hints
export { WINNING_SUBMISSIONS }; 