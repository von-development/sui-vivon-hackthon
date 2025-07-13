import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { useSuiClient } from "@mysten/dapp-kit";
import { AppContext } from "@/context/AppContext";
import { SuiService, BountyPool } from "@/services/suiService";
import { useUserStore } from "@/stores/useUserStore";
import Navigation from "@/components/navigation";
import ActionButton from "@/components/buttons/actionButton";
import { 
  Target, 
  Trophy, 
  DollarSign, 
  Users, 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  TrendingUp,
  Star,
  Shield,
  Activity,
  Clock, 
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface BountyWithMetadata extends BountyPool {
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  participants: number;
  timeRemaining: string;
  featured: boolean;
}

export default function Bounties() {
  const router = useRouter();
  const client = useSuiClient();
  const { walletAddress } = useContext(AppContext);
  const { network } = useUserStore();
  
  const [bounties, setBounties] = useState<BountyWithMetadata[]>([]);
  const [filteredBounties, setFilteredBounties] = useState<BountyWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  const suiService = new SuiService(client, network);

  const categories = [
    { id: "all", label: "All Categories", icon: Target },
    { id: "jailbreak", label: "AI Jailbreak", icon: Shield },
    { id: "security", label: "Security", icon: Shield },
    { id: "defi", label: "DeFi", icon: DollarSign },
    { id: "gaming", label: "Gaming", icon: Trophy },
  ];

  const difficulties = [
    { id: "all", label: "All Levels" },
    { id: "Easy", label: "Easy" },
    { id: "Medium", label: "Medium" },
    { id: "Hard", label: "Hard" },
  ];

  const sortOptions = [
    { id: "newest", label: "Newest First" },
    { id: "oldest", label: "Oldest First" },
    { id: "highest-prize", label: "Highest Prize" },
    { id: "lowest-prize", label: "Lowest Prize" },
    { id: "most-active", label: "Most Active" },
  ];

  useEffect(() => {
    loadBounties();
  }, [client, network]);

  useEffect(() => {
    applyFilters();
  }, [bounties, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const loadBounties = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to load from blockchain first
      let bountyPools = [];
      try {
        bountyPools = await suiService.bounty.getBountyPools(50);
      } catch (blockchainError) {
        console.log("Blockchain bounties not available, using mock data");
        // Use mock data if blockchain fails
        bountyPools = [
          {
            id: "mock-1",
            balance: "5.5",
            attemptFee: "0.1",
            specUri: "Mock AI Safety Challenge",
            oracleCapId: "mock-oracle-1",
            submissionCount: 8,
            created: new Date().toISOString(),
            title: "AI Safety Challenge",
            description: "Test your skills in AI safety and jailbreak prevention"
          },
          {
            id: "mock-2", 
            balance: "12.0",
            attemptFee: "0.2",
            specUri: "Mock DeFi Security Audit",
            oracleCapId: "mock-oracle-2", 
            submissionCount: 3,
            created: new Date().toISOString(),
            title: "DeFi Security Audit",
            description: "Find vulnerabilities in this DeFi protocol"
          },
          {
            id: "mock-3",
            balance: "8.25", 
            attemptFee: "0.15",
            specUri: "Mock Gaming Economy",
            oracleCapId: "mock-oracle-3",
            submissionCount: 15,
            created: new Date().toISOString(),
            title: "Gaming Economy Design", 
            description: "Design a balanced gaming token economy"
          }
        ];
      }
      
      // Enhance bounties with metadata
      const enhancedBounties: BountyWithMetadata[] = bountyPools.map((bounty, index) => ({
        ...bounty,
        category: index % 2 === 0 ? "jailbreak" : "security",
        difficulty: ["Easy", "Medium", "Hard"][index % 3] as "Easy" | "Medium" | "Hard",
        participants: Math.floor(Math.random() * 20) + 1,
        timeRemaining: ["2 days", "1 week", "3 days", "5 days"][index % 4],
        featured: index < 3,
      }));
      
      setBounties(enhancedBounties);
    } catch (err) {
      console.error("Error loading bounties:", err);
      setError("Failed to load bounties. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bounties];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(bounty => 
        bounty.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bounty.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(bounty => bounty.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(bounty => bounty.difficulty === selectedDifficulty);
    }

    // Sort
      switch (sortBy) {
        case "newest":
        filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        break;
        case "oldest":
        filtered.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
        break;
      case "highest-prize":
        filtered.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
        break;
      case "lowest-prize":
        filtered.sort((a, b) => parseFloat(a.balance) - parseFloat(b.balance));
        break;
      case "most-active":
        filtered.sort((a, b) => b.participants - a.participants);
        break;
    }

    setFilteredBounties(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "Medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "Hard":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "jailbreak":
        return Shield;
      case "security":
        return Shield;
      case "defi":
        return DollarSign;
      case "gaming":
        return Trophy;
      default:
        return Target;
    }
  };

  const formatBalance = (balance: any): string => {
    if (typeof balance === 'object') {
      return "0";
    }
    
    const balanceStr = balance?.toString() || "0";
    let balanceNum = parseFloat(balanceStr);
    
    // Convert from smallest units (MIST) to SUI if the number is very large
    if (balanceNum > 1000000000) {
      balanceNum = balanceNum / 1000000000;
    }
    
    // Convert SUI to VIVON (1 SUI = 100 VIVON)
    const vivonAmount = balanceNum * 100;
    
    return vivonAmount.toFixed(0); // Show whole VIVON amounts
  };

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
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-6">
              Active Bounties
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Discover security challenges, earn VIVON tokens, and collect exclusive NFT badges
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ActionButton
              label="Create Bounty"
              isConnected={!!walletAddress}
              isLoading={false}
              onClick={() => router.push("/create-bounty")}
                buttonClass="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                contentClass="text-white"
              />
              <button
                onClick={loadBounties}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-400" />
              </div>
                <div>
              <div className="text-2xl font-bold text-white">{bounties.length}</div>
                  <div className="text-sm text-white/60">Active Bounties</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
              </div>
                <div>
              <div className="text-2xl font-bold text-white">
                    {bounties.reduce((sum, b) => {
                      let balanceNum = parseFloat(b.balance);
                      // Convert from MIST to SUI if needed
                      if (balanceNum > 1000000000) {
                        balanceNum = balanceNum / 1000000000;
                      }
                      // Convert SUI to VIVON (1 SUI = 100 VIVON)
                      return sum + (balanceNum * 100);
                    }, 0).toFixed(0)}
                  </div>
                  <div className="text-sm text-white/60">Total Prize Pool (VIVON)</div>
              </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
              </div>
                <div>
              <div className="text-2xl font-bold text-white">
                    {bounties.reduce((sum, b) => sum + b.participants, 0)}
                  </div>
                  <div className="text-sm text-white/60">Participants</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
                <div>
              <div className="text-2xl font-bold text-white">
                    {bounties.filter(b => b.featured).length}
                  </div>
                  <div className="text-sm text-white/60">Featured</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search bounties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                      selectedCategory === category.id
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                    )}
                  >
                    <category.icon className="w-4 h-4" />
                    <span className="text-sm">{category.label}</span>
                  </button>
                ))}
              </div>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id} className="bg-gray-800">
                    {difficulty.label}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bounties Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mb-4"></div>
              <div className="text-white/70">Loading bounties...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <div className="text-red-400 text-lg mb-4">{error}</div>
              <button
                onClick={loadBounties}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredBounties.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <div className="text-white/70 text-lg mb-4">No bounties found</div>
              <div className="text-white/50">Try adjusting your filters or search terms</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBounties.map((bounty) => {
                const CategoryIcon = getCategoryIcon(bounty.category);
                return (
                  <div
                    key={bounty.id}
                    className={cn(
                      "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/20 group",
                      bounty.featured && "ring-2 ring-blue-500/30"
                    )}
                    onClick={() => router.push(`/bounty/${bounty.id}`)}
                  >
                    {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-blue-400" />
                      </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {bounty.title || `Bounty ${bounty.id.slice(0, 8)}...`}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Calendar className="w-4 h-4" />
                            {formatDate(bounty.created)}
                          </div>
                        </div>
                      </div>
                      {bounty.featured && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                          <Star className="w-3 h-3" />
                          Featured
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-white/70 text-sm mb-4 line-clamp-3">
                      {bounty.description || "No description available"}
                    </p>

                    {/* Prize and Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-green-400">
                          {formatBalance(bounty.balance)} VIVON
                        </div>
                        <div className="text-sm text-white/60">prize</div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border",
                        getDifficultyColor(bounty.difficulty)
                      )}>
                        {bounty.difficulty}
                      </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {bounty.participants}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {typeof bounty.submissionCount === 'object' ? '0' : bounty.submissionCount}
                  </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {bounty.timeRemaining}
                    </div>
                    </div>
                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </main>
  );
} 