import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { STRUCT_TYPE_TARGETS, TOKEN_CONSTANTS } from "../constants/contractConstants";

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  inputToken: string;
  outputToken: string;
  priceImpact: number;
  minimumReceived: string;
  fee: string;
}

export interface SwapResult {
  success: boolean;
  digest?: string;
  error?: string;
}

export class DexService {
  private client: SuiClient;
  private network: string;

  constructor(client: SuiClient, network: string = "testnet") {
    this.client = client;
    this.network = network;
  }

  /**
   * Get a quote for swapping tokens
   * For now, we'll use a simple fixed exchange rate
   * In a real DEX, this would query liquidity pools
   */
  async getSwapQuote(
    inputToken: string,
    outputToken: string,
    inputAmount: string,
    slippage: number = 0.5
  ): Promise<SwapQuote> {
    const inputAmountNum = parseFloat(inputAmount);
    
    // Fixed exchange rates (in a real DEX, this would come from liquidity pools)
    let outputAmountNum: number;
    let priceImpact = 0.1; // 0.1% price impact
    let fee = inputAmountNum * 0.003; // 0.3% fee
    
    if (inputToken === "SUI" && outputToken === "VIVON") {
      // 1 SUI = 100 VIVON (fixed rate for demo)
      outputAmountNum = inputAmountNum * 100;
    } else if (inputToken === "VIVON" && outputToken === "SUI") {
      // 100 VIVON = 1 SUI
      outputAmountNum = inputAmountNum / 100;
    } else {
      throw new Error("Unsupported token pair");
    }

    const outputAmount = (outputAmountNum * (1 - slippage / 100)).toString();
    const minimumReceived = (outputAmountNum * (1 - slippage / 100 - priceImpact / 100)).toString();

    return {
      inputAmount,
      outputAmount,
      inputToken,
      outputToken,
      priceImpact,
      minimumReceived,
      fee: fee.toString(),
    };
  }

  /**
   * Create a swap transaction for SUI to VIVON
   * This works for the deployer who owns the MintCapability
   */
  async createSuiToVivonSwap(
    sender: string,
    suiAmount: string,
    minimumVivonReceived: string
  ): Promise<Transaction> {
    // Original deployer address (the one that actually owns the MintCapability)
    const deployerAddress = "0x1a1d337e5b1482359cf62bb6cb46213342eb70d69cc1ce440f95de271f2c891c";
    const mintCapId = this.getMintCapId();
    
    // Normalize addresses for comparison (remove 0x prefix, convert to lowercase)
    const normalizedSender = sender.toLowerCase().replace(/^0x/, '');
    const normalizedDeployer = deployerAddress.toLowerCase().replace(/^0x/, '');
    
    console.log('Address comparison:', {
      sender: sender,
      normalizedSender: normalizedSender,
      deployerAddress: deployerAddress,
      normalizedDeployer: normalizedDeployer,
      isMatch: normalizedSender === normalizedDeployer
    });
    
    // Check if sender is the deployer
    if (normalizedSender !== normalizedDeployer) {
      throw new Error(
        `SUI to VIVON swap requires MintCapability owned by deployer (${deployerAddress}). ` +
        `Your current address: ${sender}. ` +
        `\n\nTo enable SUI → VIVON swaps, you need to either:` +
        `\n1. Switch to the deployer wallet address: ${deployerAddress}` +
        `\n2. Transfer the MintCapability to your current address` +
        `\n3. Use a production DEX with liquidity pools` +
        `\n\nFor now, you can get VIVON tokens through bounty rewards.`
      );
    }

    console.log('✅ Address match confirmed! Proceeding with SUI to VIVON swap for deployer');

    const tx = new Transaction();
    tx.setSender(sender);

    // Convert amounts to smallest units
    const suiAmountMist = BigInt(Math.floor(parseFloat(suiAmount) * 1e9));
    const vivonAmountSmallest = BigInt(Math.floor(parseFloat(suiAmount) * 100 * 1e9)); // 1 SUI = 100 VIVON

    try {
      // Get user's SUI coins
      const suiCoins = await this.client.getCoins({
        owner: sender,
        coinType: "0x2::sui::SUI",
      });

      if (!suiCoins.data || suiCoins.data.length === 0) {
        throw new Error("No SUI coins found in wallet");
      }

      // Calculate total SUI balance
      const totalSuiBalance = suiCoins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
      
      if (totalSuiBalance < suiAmountMist) {
        throw new Error(`Insufficient SUI balance. Need ${suiAmountMist}, have ${totalSuiBalance}`);
      }

      // Prepare SUI coins for payment
      let suiCoinIds: string[] = [];
      let collectedAmount = BigInt(0);
      
      for (const coin of suiCoins.data) {
        suiCoinIds.push(coin.coinObjectId);
        collectedAmount += BigInt(coin.balance);
        if (collectedAmount >= suiAmountMist) {
          break;
        }
      }

      // Merge SUI coins if we have multiple
      let suiCoinToUse = suiCoinIds[0];
      if (suiCoinIds.length > 1) {
        const [primaryCoin, ...otherCoins] = suiCoinIds;
        if (otherCoins.length > 0) {
          tx.mergeCoins(primaryCoin, otherCoins);
        }
        suiCoinToUse = primaryCoin;
      }

      // Split the exact amount of SUI needed
      const [suiPayment] = tx.splitCoins(suiCoinToUse, [suiAmountMist]);

      // Treasury address (deployer keeps the SUI for now)
      const treasuryAddress = deployerAddress;

      // Transfer SUI payment to treasury
      tx.transferObjects([suiPayment], treasuryAddress);

      // Mint VIVON tokens to the sender
      tx.moveCall({
        package: this.getPackageId(),
        module: "vivon",
        function: "mint",
        arguments: [
          tx.object(mintCapId),
          tx.pure.u64(vivonAmountSmallest),
          tx.pure.address(sender),
        ],
      });

      console.log(`✅ SUI to VIVON swap transaction created:
        - SUI amount: ${suiAmount} (${suiAmountMist} mist)
        - VIVON amount: ${parseFloat(suiAmount) * 100} (${vivonAmountSmallest} smallest unit)
        - Deployer: ${sender}
        - MintCap ID: ${mintCapId}
        - Package: ${this.getPackageId()}`);

      return tx;
    } catch (error) {
      console.error("❌ Error creating SUI to VIVON swap:", error);
      throw error;
    }
  }

  /**
   * Create a swap transaction for VIVON to SUI
   * This creates a real transaction that transfers VIVON and releases SUI
   */
  async createVivonToSuiSwap(
    sender: string,
    vivonAmount: string,
    minimumSuiReceived: string
  ): Promise<Transaction> {
    const tx = new Transaction();
    tx.setSender(sender);

    // Convert VIVON amount to smallest unit (9 decimals)
    const vivonAmountSmallest = BigInt(Math.floor(parseFloat(vivonAmount) * 1e9));
    
    // Calculate SUI amount (100 VIVON = 1 SUI)
    const suiAmountMist = BigInt(Math.floor(parseFloat(vivonAmount) / 100 * 1e9));

    try {
      // Get user's VIVON coins
      const vivonCoins = await this.client.getCoins({
        owner: sender,
        coinType: `${this.getPackageId()}::vivon::VIVON`,
      });

      if (!vivonCoins.data || vivonCoins.data.length === 0) {
        throw new Error("No VIVON coins found in wallet");
      }

      // Calculate total VIVON balance
      const totalBalance = vivonCoins.data.reduce(
        (sum, coin) => sum + BigInt(coin.balance),
        BigInt(0)
      );

      if (totalBalance < vivonAmountSmallest) {
        throw new Error(
          `Insufficient VIVON balance. Have: ${Number(totalBalance) / 1e9}, Need: ${vivonAmount}`
        );
      }

      // Merge VIVON coins if needed and take the required amount
      let vivonCoin;
      if (vivonCoins.data.length === 1) {
        vivonCoin = tx.object(vivonCoins.data[0].coinObjectId);
      } else {
        // Merge coins first
        const primaryCoin = tx.object(vivonCoins.data[0].coinObjectId);
        const coinsToMerge = vivonCoins.data.slice(1).map(coin => tx.object(coin.coinObjectId));
        tx.mergeCoins(primaryCoin, coinsToMerge);
        vivonCoin = primaryCoin;
      }

      // Split the exact amount of VIVON needed
      const [vivonToTransfer] = tx.splitCoins(vivonCoin, [vivonAmountSmallest.toString()]);

      // Transfer VIVON to treasury (for this example, we'll burn it to the zero address for demo)
      // In a real DEX, this would go to a treasury or liquidity pool
      const treasuryAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";
      tx.transferObjects([vivonToTransfer], treasuryAddress);

      // Split SUI from gas and transfer to sender
      const [suiPayment] = tx.splitCoins(tx.gas, [suiAmountMist.toString()]);
      tx.transferObjects([suiPayment], sender);

      return tx;
    } catch (error) {
      throw new Error(`Failed to create VIVON swap transaction: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Execute a swap transaction
   */
  async executeSwap(
    transaction: Transaction,
    signAndExecute: (transaction: { transaction: Transaction }) => Promise<any>
  ): Promise<SwapResult> {
    try {
      const result = await signAndExecute({ transaction });
      return {
        success: true,
        digest: result.digest,
      };
    } catch (error) {
      console.error("Swap execution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get token balance for a given address
   */
  async getTokenBalance(address: string, tokenType: string): Promise<string> {
    try {
      let coinType: string;
      
      if (tokenType === "SUI") {
        coinType = "0x2::sui::SUI";
      } else if (tokenType === "VIVON") {
        coinType = STRUCT_TYPE_TARGETS.VIVON_TOKEN(this.network);
      } else {
        throw new Error(`Unsupported token type: ${tokenType}`);
      }

      const balance = await this.client.getBalance({
        owner: address,
        coinType,
      });

      return balance.totalBalance;
    } catch (error) {
      console.error(`Error getting ${tokenType} balance:`, error);
      return "0";
    }
  }

  /**
   * Get all available tokens for swapping
   */
  getSupportedTokens(): string[] {
    return ["SUI", "VIVON"];
  }

  /**
   * Check if a token pair is supported
   */
  isTokenPairSupported(tokenA: string, tokenB: string): boolean {
    const supportedTokens = this.getSupportedTokens();
    return supportedTokens.includes(tokenA) && supportedTokens.includes(tokenB) && tokenA !== tokenB;
  }

  // Helper methods
  private getPackageId(): string {
    return "0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7";
  }

  private getMintCapId(): string {
    // MintCapability owned by deployer - not accessible for general use
    return "0x23a1e35b18da3a43982628308e8ca17d7dd43fb7f76bfdc5899b27b8dfff62f7";
  }
}

export default DexService; 