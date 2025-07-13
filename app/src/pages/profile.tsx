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
import BasicInputField from "@/components/fields/basicInputField";
import ActionButton from "@/components/buttons/actionButton";
import { useTransactionMonitor } from "@/hooks/useTransactionMonitor";
import { useBalanceTracker } from "@/hooks/useBalanceTracker";
import { SuiService } from "@/services/suiService";
import { 
  UserCircle, 
  Trophy, 
  Target, 
  Coins, 
  Award, 
  TrendingUp, 
  Calendar,
  MapPin,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Code2,
  Settings,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpDown,
  Wallet,
  RefreshCw,
  Activity,
  Clock
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function Profile() {
  const { walletAddress, suiName } = useContext(AppContext);
  const client = useSuiClient();
  const [account] = useAccounts();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { network, setNetwork, rpcUrl, setRpcUrl } = useUserStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "swap" | "settings">("overview");
  const [selectedToken, setSelectedToken] = useState<string>("SUI");
  const [toToken, setToToken] = useState<string>("VIVON");
  const [input, setInput] = useState<string>("");

  // Use our custom hooks for blockchain integration
  const { 
    transactions: monitoredTransactions, 
    isMonitoring: transactionsLoading
  } = useTransactionMonitor();

  const { 
    balances, 
    isLoading: balancesLoading, 
    refreshBalances 
  } = useBalanceTracker();

  // Get wallet balance
  const { data: suiBalance, isLoading: balanceLoading } = useSuiClientQuery("getBalance", {
    owner: walletAddress ?? "",
  }, {
    enabled: !!walletAddress,
  });

  const userBalance = useMemo(() => {
    if (balances?.sui) {
      return parseFloat(balances.sui.formattedBalance);
    }
    if (suiBalance?.totalBalance) {
      return (Number(suiBalance.totalBalance) / 10 ** 9);
    }
    return 0;
  }, [balances?.sui, suiBalance]);

  const rpcNodes = getRpcNodes(network as Network);

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTransactionType = (tx: any) => {
    if (tx.type) {
      return tx.type;
    }
    if (tx.transaction?.data?.transaction?.kind === "ProgrammableTransaction") {
      return "Transaction";
    }
    return "Transfer";
  };

  const getTransactionDirection = (tx: any) => {
    if (tx.direction) {
      return tx.direction;
    }
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
    if (tx.amount) {
      return tx.amount.toFixed(4);
    }
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

  const formatTimestamp = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  async function handleSwapTx() {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!input || parseFloat(input) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!selectedToken || !toToken) {
      toast.error("Please select both tokens");
      return;
    }

    try {
      const suiService = new SuiService(client, network);
      
      // Get swap quote
      toast.info("Getting swap quote...");
      const quote = await suiService.dex.getSwapQuote(
        selectedToken,
        toToken,
        input,
        0.5 // 0.5% slippage
      );
      
      toast.info(`Preparing to swap ${input} ${selectedToken} for ~${parseFloat(quote.outputAmount).toFixed(4)} ${toToken}`);
      
      // Create swap transaction
      let transaction;
      if (selectedToken === "SUI" && toToken === "VIVON") {
        try {
          transaction = await suiService.dex.createSuiToVivonSwap(
            account.address,
            input,
            quote.minimumReceived
          );
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "SUI to VIVON swap not available");
          return;
        }
      } else if (selectedToken === "VIVON" && toToken === "SUI") {
        transaction = await suiService.dex.createVivonToSuiSwap(
          account.address,
          input,
          quote.minimumReceived
        );
      } else {
        throw new Error("Unsupported swap pair");
      }
      
      // Execute the transaction
      toast.info("Please confirm the transaction in your wallet...");
      
      signAndExecuteTransaction({
        transaction,
      }, {
        onSuccess: (result) => {
          toast.success(`Swap successful! Transaction: ${result.digest.slice(0, 8)}...`);
          refreshBalances();
          setInput("");
        },
        onError: (error) => {
          toast.error("Transaction failed: " + (error instanceof Error ? error.message : "Unknown error"));
        }
      });
      
    } catch (error) {
      console.error("Swap failed:", error);
      toast.error("Swap failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  const handleRefreshData = async () => {
    toast.info("Refreshing data...");
    await refreshBalances();
    toast.success("Data refreshed!");
  };

  // Mock data for achievements and statistics
  const mockStats = {
    challengesWon: 0,
    vivonEarned: balances?.vivon ? parseFloat(balances.vivon.formattedBalance) : 0,
    nftBadges: (balances?.badges?.length || 0) + (balances?.nfts?.length || 0),
    rankPoints: 0
  };

  if (!walletAddress) {
    return (
      <main className={cn("relative w-full min-h-screen bg-black", inter.className)}>
        <Navigation />
        <div className="pt-24 px-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Wallet className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-white/70">Please connect your wallet to view your profile.</p>
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
          
          {/* Profile Header */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <UserCircle className="w-12 h-12 text-white/80" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {suiName || "Anonymous User"}
                </h1>
                <div className="flex items-center gap-2 text-white/60 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>Member since {new Date().getFullYear()}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-white/70 font-mono">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-white mb-1">
                    {balancesLoading ? "Loading..." : `${userBalance.toFixed(3)} SUI`}
                  </div>
                  <div className="text-sm text-white/60">Wallet Balance</div>
                </div>
                
                <button
                  onClick={handleRefreshData}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white/70">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8">
            {[
              { id: "overview", label: "Overview", icon: UserCircle },
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
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{mockStats.challengesWon}</div>
                      <div className="text-sm text-white/60">Challenges Won</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {balancesLoading ? "..." : mockStats.vivonEarned.toFixed(2)}
                      </div>
                      <div className="text-sm text-white/60">VIVON Earned</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{mockStats.nftBadges}</div>
                      <div className="text-sm text-white/60">NFT Badges</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{mockStats.rankPoints}</div>
                      <div className="text-sm text-white/60">Rank Points</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity & Achievements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Recent Activity */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/60">Live</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Welcome to VIVON!</div>
                        <div className="text-sm text-white/60">Account created</div>
                      </div>
                      <div className="text-xs text-white/50">Just now</div>
                    </div>
                    
                    <div className="text-center py-8 text-white/60">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <div>Start your first challenge to see activity here</div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <History className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/60">
                        {transactionsLoading ? "Loading..." : "Updated"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {transactionsLoading ? (
                      <div className="text-center py-8 text-white/60">
                        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
                        <div>Loading transactions...</div>
                      </div>
                    ) : monitoredTransactions.length > 0 ? (
                      monitoredTransactions.slice(0, 5).map((tx: any) => (
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
                            {formatTimestamp(tx.timestampMs || tx.timestamp)}
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

              {/* Achievements */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg opacity-50">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">First Steps</div>
                      <div className="text-sm text-white/60">Complete your first challenge</div>
                    </div>
                    <div className="text-xs text-white/50">Locked</div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg opacity-50">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Quick Learner</div>
                      <div className="text-sm text-white/60">Complete 5 challenges</div>
                    </div>
                    <div className="text-xs text-white/50">Locked</div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg opacity-50">
                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Security Expert</div>
                      <div className="text-sm text-white/60">Master cybersecurity challenges</div>
                    </div>
                    <div className="text-xs text-white/50">Locked</div>
                  </div>
                </div>
              </div>

              {/* NFT Badges */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">NFT Badges</h3>
                  </div>
                  <div className="text-sm text-white/60">
                    {balances?.badges?.length || 0} earned
                  </div>
                </div>
                
                {balances?.badges && balances.badges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {balances.badges.map((badge) => (
                      <div key={badge.objectId} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                            <img 
                              src={badge.imageUrl} 
                              alt={badge.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-white/40" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg></div>';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{badge.name}</div>
                            <div className="text-sm text-white/60 mb-2">{badge.description}</div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                {badge.attributes?.rarity || 'Common'}
                              </span>
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                {badge.attributes?.category || 'General'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <div>No badges earned yet</div>
                    <div className="text-sm text-white/40 mt-1">Complete challenges to earn NFT badges</div>
                  </div>
                )}
              </div>

              {/* NFT Collections */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">NFT Collections</h3>
                  </div>
                  <div className="text-sm text-white/60">
                    {balances?.nfts?.length || 0} collected
                  </div>
                </div>
                
                {balances?.nfts && balances.nfts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {balances.nfts.map((nft) => (
                      <div key={nft.objectId} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/10 mb-4">
                          <img 
                            src={nft.imageUrl} 
                            alt={nft.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-white/40" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg></div>';
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-white font-medium">{nft.name}</div>
                          <div className="text-sm text-white/60 mb-2">{nft.collection}</div>
                          <div className="text-xs text-white/50">{nft.description}</div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                              {nft.attributes?.rarity || 'Standard'}
                            </span>
                            {nft.attributes?.edition && (
                              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                                #{nft.attributes.edition}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <div>No NFTs collected yet</div>
                    <div className="text-sm text-white/40 mt-1">Participate in bounties to collect unique NFTs</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "swap" && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Token Swap</h2>
                  <p className="text-sm text-blue-400 mt-1">🔗 Real blockchain transactions - Wallet approval required</p>
                </div>
              </div>
              
              <div className="max-w-md mx-auto space-y-4">
                {/* From Token */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">From</label>
                  <BasicInputField
                    label="You Pay"
                    inputValue={input}
                    setInputValue={setInput}
                    tokenInfo={["SUI", "VIVON"]}
                    canSelectToken={true}
                    selectedToken={selectedToken}
                    setSelectedToken={setSelectedToken}
                    maxValue={selectedToken === "SUI" ? userBalance : (balances?.vivon ? parseFloat(balances.vivon.formattedBalance) : 0)}
                  />
                </div>
                
                {/* Swap Direction Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      const temp = selectedToken;
                      setSelectedToken(toToken);
                      setToToken(temp);
                      setInput("");
                    }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <ArrowUpDown className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                {/* To Token */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">To</label>
                  <BasicInputField
                    label="You Receive"
                    inputValue={input ? (parseFloat(input) * (selectedToken === "SUI" ? 100 : 0.01)).toFixed(4) : ""}
                    setInputValue={() => {}}
                                         tokenInfo={[toToken as BasicCoin]}
                     canSelectToken={false}
                     selectedToken={toToken}
                    isReadOnly={true}
                  />
                </div>
                
                {/* Swap Button */}
                <ActionButton
                  label={`Swap ${selectedToken} for ${toToken}`}
                  isConnected={!!walletAddress}
                  isLoading={false}
                  onClick={handleSwapTx}
                  buttonClass="w-full"
                />
                
                {/* Exchange Rate Info */}
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-white/60 mb-2">Exchange Rate</div>
                  <div className="text-white font-medium">
                    1 {selectedToken} = {selectedToken === "SUI" ? "100" : "0.01"} {toToken}
                  </div>
                  <div className="text-xs text-blue-400 mt-2">
                    {selectedToken === "SUI" ? 
                      walletAddress === "0x1a1d337e5b1482359cf62bb6cb46213342eb70d69cc1ce440f95de271f2c891c" ?
                        "✅ SUI → VIVON available (You own the MintCapability)" :
                        "⚠️ SUI → VIVON requires MintCapability (Contact VIVON team)" :
                      "✅ VIVON → SUI uses real blockchain transactions"
                    }
                  </div>
                  {selectedToken === "SUI" && walletAddress !== "0x1a1d337e5b1482359cf62bb6cb46213342eb70d69cc1ce440f95de271f2c891c" && (
                    <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="text-sm text-orange-400 font-medium mb-2">SUI → VIVON Swap Unavailable</div>
                      <div className="text-xs text-white/60 mb-2">
                        Your current wallet: <span className="font-mono">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
                      </div>
                      <div className="text-xs text-white/60 mb-2">
                        Required wallet: <span className="font-mono">0x1a1d...891c</span>
                      </div>
                      <div className="text-xs text-orange-300">
                        💡 Switch to the deployer wallet or get VIVON through bounty rewards.
                      </div>
                    </div>
                  )}
                  {selectedToken === "SUI" && walletAddress === "0x1a1d337e5b1482359cf62bb6cb46213342eb70d69cc1ce440f95de271f2c891c" && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="text-sm text-green-400 font-medium mb-2">Developer Access</div>
                      <div className="text-xs text-white/60 mb-2">
                        You own the MintCapability and can mint VIVON tokens by swapping SUI.
                      </div>
                      <div className="text-xs text-green-300">
                        🚀 As the developer, you can create SUI → VIVON swaps using the mint function.
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Current Balances */}
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-white/60 mb-2">Current Balances</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">SUI</span>
                      <span className="text-white font-medium">
                        {balancesLoading ? "Loading..." : `${userBalance.toFixed(3)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">VIVON</span>
                      <span className="text-white font-medium">
                        {balancesLoading ? "Loading..." : `${(balances?.vivon ? parseFloat(balances.vivon.formattedBalance) : 0).toFixed(3)}`}
                      </span>
                    </div>
                  </div>
                </div>
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
                      <option key={net} value={net} className="bg-gray-800">
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
                      <option key={node.url} value={node.url} className="bg-gray-800">
                        {node.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-white/60 mb-2">Wallet Information</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">Address</span>
                      <span className="text-white font-mono text-sm">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Network</span>
                      <span className="text-white font-medium">{network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Status</span>
                      <span className="text-green-400 font-medium">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 