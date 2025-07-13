import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import { useContext, useMemo, useState } from "react";
import { AppContext } from "@/context/AppContext";
import { 
  useSuiClientQuery, 
  useAccounts, 
  useSignAndExecuteTransaction, 
  useSuiClient 
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "react-toastify";
import { useUserStore } from "@/stores/useUserStore";
import { getRpcNodes } from "@/constants/rpcNodeList";
import { NETWROK_LIST } from "@/constants/networkList";
import BasicDataField from "@/components/fields/basicDataField";
import BasicInputField from "@/components/fields/basicInputField";
import ActionButton from "@/components/buttons/actionButton";
import { 
  Wallet, 
  TrendingUp, 
  Settings, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  Clock,
  Zap
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function Dashboard() {
  const { walletAddress, suiName } = useContext(AppContext);
  const client = useSuiClient();
  const [account] = useAccounts();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { network, setNetwork, rpcUrl, setRpcUrl } = useUserStore();
  const [selectedToken, setSelectedToken] = useState<string>("SUI");
  const [input, setInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"wallet" | "swap" | "settings">("wallet");

  // Get wallet balance
  const { data: suiBalance, isLoading: balanceLoading } = useSuiClientQuery("getBalance", {
    owner: walletAddress ?? "",
  }, {
    enabled: !!walletAddress,
  });

  // Get recent transactions
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

  const userBalance = useMemo(() => {
    if (suiBalance?.totalBalance) {
      return (Number(suiBalance.totalBalance) / 10 ** 9);
    }
    return 0;
  }, [suiBalance]);

  const rpcNodes = getRpcNodes(network as Network);

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

    const tx = new Transaction();

    try {
      tx.setSender(account.address);
      const dryRunRes = await client.dryRunTransactionBlock({
        transactionBlock: await tx.build({ client }),
      });
      if (dryRunRes.effects.status.status === "failure") {
        toast.error(dryRunRes.effects.status.error);
        return;
      }

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
          },
          onError: (err) => {
            toast.error(err.message);
          },
        },
      );
    } catch (error) {
      toast.error("Transaction failed");
    }
  }

  if (!walletAddress) {
    return (
      <main className={cn("relative w-full min-h-screen bg-black", inter.className)}>
        <Navigation />
        <div className="pt-24 px-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-white/70">Please connect your wallet to access the dashboard.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn("relative w-full min-h-screen bg-black", inter.className)}>
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}>
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Content */}
      <div className="relative z-10 pt-24 px-6 pb-12">
        <div className="max-w-6xl mx-auto">
        
          {/* Page Header */}
            <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
            <p className="text-white/70">Manage your wallet and trading activities</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8">
            {[
              { id: "wallet", label: "Wallet", icon: Wallet },
              { id: "swap", label: "Swap", icon: TrendingUp },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "wallet" && (
            <div className="space-y-8">
              {/* Wallet Overview */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Wallet Overview</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-white/60 mb-1">Balance</div>
                    <div className="text-2xl font-bold text-white">
                      {balanceLoading ? "Loading..." : `${userBalance.toFixed(3)} SUI`}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-white/60 mb-1">Network</div>
                    <div className="text-lg font-medium text-white capitalize">{network}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-white/60 mb-1">Address</div>
                    <div className="text-sm font-mono text-white">
                      {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <History className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                </div>
                
                <div className="space-y-3">
                  {transactionsLoading ? (
                    <div className="text-center py-8 text-white/60">Loading transactions...</div>
                  ) : transactionHistory?.data?.length ? (
                    transactionHistory.data.slice(0, 5).map((tx: any) => (
                      <div key={tx.digest} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          {getTransactionDirection(tx) === "received" ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{formatTransactionType(tx)}</div>
                          <div className="text-sm text-white/60">
                            {getTransactionAmount(tx)} SUI
                          </div>
                        </div>
                        <div className="text-xs text-white/50">
                          {formatTimestamp(tx.timestampMs)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-white/60">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <div>No transactions found</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "swap" && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Token Swap</h2>
              </div>
              
              <div className="max-w-md mx-auto space-y-4">
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
          )}

          {activeTab === "settings" && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Settings</h2>
              </div>
              
              <div className="max-w-md mx-auto space-y-6">
                                 <div>
                   <label className="block text-sm font-medium text-white mb-2">Network</label>
                   <select
                     value={network}
                     onChange={(e) => setNetwork(e.target.value)}
                     className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                   >
                     {NETWROK_LIST.map((net) => (
                       <option key={net} value={net} className="bg-black">
                         {net}
                       </option>
                     ))}
                   </select>
            </div>

                 <div>
                   <label className="block text-sm font-medium text-white mb-2">RPC Node</label>
                   <select
                     value={rpcUrl}
                     onChange={(e) => setRpcUrl(e.target.value)}
                     className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                   >
                     {rpcNodes.map((node) => (
                       <option key={node.url} value={node.url} className="bg-black">
                         {node.name}
                       </option>
                     ))}
                   </select>
                 </div>
              </div>
          </div>
          )}
        </div>
      </div>
    </main>
  );
} 