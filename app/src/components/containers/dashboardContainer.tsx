import BasicDataField from "../fields/basicDataField";
import BasicInputField from "../fields/basicInputField";
import ActionButton from "../buttons/actionButton";
import { useContext, useMemo, useState } from "react";
import {
  useAccounts,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { AppContext } from "@/context/AppContext";
import { toast } from "react-toastify";
import { useUserStore } from "@/stores/useUserStore";
import { getRpcNodes } from "@/constants/rpcNodeList";
import { NETWROK_LIST } from "@/constants/networkList";
import { NetworkIcon, Hexagon, Wallet, TrendingUp, Settings, Zap, RefreshCw, Clock, ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const DashboardContainer = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const { data: suiBalance, isLoading: balanceLoading, error: balanceError } = useSuiClientQuery("getBalance", {
    owner: walletAddress ?? "",
  }, {
    enabled: !!walletAddress,
  });

  // Fetch recent transactions
  const { data: transactionHistory, isLoading: transactionsLoading } = useSuiClientQuery(
    "queryTransactionBlocks",
    {
      filter: {
        FromOrToAddress: {
          addr: walletAddress ?? "",
        },
      },
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
      limit: 10,
    },
    {
      enabled: !!walletAddress,
    }
  );

  // Debug logging
  console.log("Dashboard Debug:", {
    walletAddress,
    suiName,
    suiBalance,
    balanceLoading,
    balanceError,
    transactionHistory,
    transactionsLoading
  });
  const [selectedToken, setSelectedToken] = useState<string>("SUI");
  const [input, setInput] = useState<string>("");
  const client = useSuiClient();
  const [account] = useAccounts();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { network, setNetwork, rpcUrl, setRpcUrl } = useUserStore();

  const userBalance = useMemo(() => {
    if (suiBalance?.totalBalance) {
      return (Number(suiBalance.totalBalance) / 10 ** 9);
    } else {
      return 0;
    }
  }, [suiBalance]);

  const formattedBalance = useMemo(() => {
    return userBalance.toFixed(3);
  }, [userBalance]);

  const rpcNodes = getRpcNodes(network as Network);

  // Helper functions for transaction formatting
  const formatTransactionType = (tx: any) => {
    if (tx.transaction?.data?.transaction?.kind === "ProgrammableTransaction") {
      return "Transaction";
    }
    return "Transfer";
  };

  const getTransactionDirection = (tx: any) => {
    const balanceChanges = tx.balanceChanges || [];
    const userChange = balanceChanges.find((change: any) => 
      change.owner?.AddressOwner === walletAddress
    );
    
    if (userChange) {
      return parseInt(userChange.amount) > 0 ? "received" : "sent";
    }
    return "unknown";
  };

  const getTransactionAmount = (tx: any) => {
    const balanceChanges = tx.balanceChanges || [];
    const userChange = balanceChanges.find((change: any) => 
      change.owner?.AddressOwner === walletAddress
    );
    
    if (userChange) {
      const amount = Math.abs(parseInt(userChange.amount)) / 10**9;
      return amount.toFixed(4);
    }
    return "0.0000";
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  async function handleSwapTx() {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    console.log("Swap transaction with input:", input);
    const tx = new Transaction();

    // Add your swap logic here
    // This is a placeholder for the actual swap implementation

    try {
      // Dry run
      tx.setSender(account.address);
      const dryRunRes = await client.dryRunTransactionBlock({
        transactionBlock: await tx.build({ client }),
      });
      if (dryRunRes.effects.status.status === "failure") {
        toast.error(dryRunRes.effects.status.error);
        return;
      }

      // Execute
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: async (txRes) => {
            const finalRes = await client.waitForTransaction({
              digest: txRes.digest,
              options: {
                showEffects: true,
              },
            });
            toast.success("Transaction successful!");
            console.log(finalRes);
          },
          onError: (err) => {
            toast.error(err.message);
            console.log(err);
          },
        },
      );
    } catch (error) {
      toast.error("Transaction failed");
      console.error(error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Row - Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Wallet Overview */}
      <div className="lg:col-span-1">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 w-10 h-10 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Wallet Overview</h2>
          </div>
          
          <div className="space-y-4">
            <BasicDataField
              label="Balance"
              value={balanceLoading ? "Loading..." : walletAddress ? formattedBalance : "0.000"}
              spaceWithUnit
              unit={balanceLoading ? "" : "SUI"}
              valueClass="text-2xl font-bold text-blue-400"
              fieldClass="w-full"
            />
            
            <div className="pt-4 border-t border-gray-700">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Network</span>
                  <span className="text-sm text-white capitalize">{network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Address</span>
                  <span className="text-sm text-gray-300 font-mono">
                    {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : "Not connected"}
                  </span>
                </div>
                {suiName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">SUI Name</span>
                    <span className="text-sm text-blue-400">{suiName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Swap */}
      <div className="lg:col-span-1">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 w-10 h-10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Token Swap</h2>
          </div>
          
          <div className="space-y-4">
            <BasicInputField
              label="Amount"
              inputValue={input}
              setInputValue={setInput}
              tokenInfo={["SUI", "BUCK", "USDC", "USDT"]}
              canSelectToken={true}
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
              maxValue={userBalance}
            />
            
            <ActionButton
              label="Swap Tokens"
              isConnected={!!walletAddress}
              isLoading={false}
              onClick={handleSwapTx}
              buttonClass="w-full"
            />
          </div>
        </div>
      </div>

      {/* Network & RPC Settings */}
      <div className="lg:col-span-1">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 w-10 h-10 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Network Settings</h2>
          </div>
          
          <div className="space-y-6">
            {/* Network Selection */}
            <div>
              <label className="block text-sm text-white/50 mb-3">
                <NetworkIcon className="w-4 h-4 inline mr-2" />
                Network
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NETWROK_LIST.map((_network) => (
                  <button
                    key={_network}
                    onClick={() => {
                      setNetwork(_network);
                      setRpcUrl(getRpcNodes(_network as Network)[0].url);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      network === _network
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {_network}
                  </button>
                ))}
              </div>
            </div>

            {/* RPC Selection */}
            <div>
              <label className="block text-sm text-white/50 mb-3">
                <Hexagon className="w-4 h-4 inline mr-2" />
                RPC Endpoint
              </label>
              <div className="space-y-2">
                {rpcNodes.map((rpcNode, idx) => (
                  <button
                    key={`rpc-${idx}`}
                    onClick={() => setRpcUrl(rpcNode.url)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      rpcNode.url === rpcUrl
                        ? "bg-purple-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <span>{rpcNode.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs">Active</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="lg:col-span-3">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 w-10 h-10 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton
              label="Create Bounty"
              isConnected={!!walletAddress}
              isLoading={false}
              onClick={() => {
                window.location.href = "/create-bounty";
              }}
              buttonClass="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              contentClass="text-white"
            />
            
            <ActionButton
              label="Browse Bounties"
              isConnected={!!walletAddress}
              isLoading={false}
              onClick={() => {
                window.location.href = "/bounties";
              }}
              buttonClass="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              contentClass="text-white"
            />
            
            <ActionButton
              label="My Submissions"
              isConnected={!!walletAddress}
              isLoading={false}
              onClick={() => {
                toast.info("Submissions view coming soon!");
              }}
              buttonClass="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              contentClass="text-white"
            />
            
            <ActionButton
              label="Badge Gallery"
              isConnected={!!walletAddress}
              isLoading={false}
              onClick={() => {
                toast.info("Badge gallery coming soon!");
              }}
              buttonClass="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              contentClass="text-white"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Recent Transactions Section */}
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 w-10 h-10 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
        {transactionsLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
        )}
      </div>
      
      <div className="space-y-3">
        {!walletAddress ? (
          <div className="text-center py-8 text-gray-400">
            Connect your wallet to view transaction history
          </div>
        ) : transactionsLoading ? (
          <div className="text-center py-8 text-gray-400">
            Loading transactions...
          </div>
        ) : !transactionHistory?.data || transactionHistory.data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No recent transactions found
          </div>
        ) : (
          transactionHistory.data.slice(0, 5).map((tx: any, index: number) => {
            const direction = getTransactionDirection(tx);
            const amount = getTransactionAmount(tx);
            const type = formatTransactionType(tx);
            
            return (
              <div
                key={tx.digest || index}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    direction === "received" 
                      ? "bg-green-500/20 text-green-400" 
                      : direction === "sent"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}>
                    {direction === "received" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : direction === "sent" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {direction === "received" ? "Received" : direction === "sent" ? "Sent" : type}
                    </div>
                    <div className="text-xs text-gray-400">
                      {tx.timestampMs ? formatTimestamp(tx.timestampMs) : "Unknown time"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      direction === "received" ? "text-green-400" : 
                      direction === "sent" ? "text-red-400" : "text-gray-300"
                    }`}>
                      {direction === "received" ? "+" : direction === "sent" ? "-" : ""}{amount} SUI
                    </div>
                    <div className="text-xs text-gray-400">
                      {tx.effects?.status?.status === "success" ? "Success" : "Failed"}
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`https://suivision.xyz/txblock/${tx.digest}`, '_blank')}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        
        {transactionHistory?.data && transactionHistory.data.length > 5 && (
          <div className="text-center pt-4">
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All Transactions
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default DashboardContainer; 