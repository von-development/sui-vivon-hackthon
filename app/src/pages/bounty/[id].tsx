import { useState, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  useAccounts,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { AppContext } from "@/context/AppContext";
import { toast } from "react-toastify";
import { SuiService, BountyPool } from "@/services/suiService";
import { useUserStore } from "@/stores/useUserStore";
import Navigation from "@/components/navigation";
import ActionButton from "@/components/buttons/actionButton";
import { 
  ArrowLeft, 
  Target, 
  DollarSign, 
  Users, 
  Clock, 
  ExternalLink,
  Send,
  AlertTriangle,
  Shield,
  Trophy,
  Hash,
  CheckCircle,
  XCircle,
  Loader,
  Lightbulb,
  Activity,
  Calendar,
  Star,
  Copy,
  Eye,
  Award
} from "lucide-react";
import { SimpleOracle, WINNING_SUBMISSIONS } from "@/lib/oracle";
import { FUNCTION_TARGETS } from "@/constants/contractConstants";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface BountyPoolExtended extends BountyPool {
  category?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  participants?: number;
  timeRemaining?: string;
  featured?: boolean;
  tags?: string[];
}

interface Submission {
  id: string;
  hunter: string;
  hash: string;
  status: "pending" | "won" | "failed";
  timestamp: string;
  isCurrentUser: boolean;
}

export default function BountyDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { walletAddress } = useContext(AppContext);
  const { network } = useUserStore();
  const [account] = useAccounts();
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [bounty, setBounty] = useState<BountyPoolExtended | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [oracleStatus, setOracleStatus] = useState("");
  const [isOracleProcessing, setIsOracleProcessing] = useState(false);
  const [oracle, setOracle] = useState<SimpleOracle | null>(null);
  const [copied, setCopied] = useState(false);

  const suiService = new SuiService(client, network);

  // Get wallet balance
  const { data: suiBalance } = useSuiClientQuery("getBalance", {
    owner: walletAddress ?? "",
  }, {
    enabled: !!walletAddress,
  });

  const userBalance = useMemo(() => {
    if (suiBalance?.totalBalance) {
      return (Number(suiBalance.totalBalance) / 10 ** 9);
    } else {
      return 0;
    }
  }, [suiBalance]);

  // Mock data - in production, this would fetch from blockchain
  const mockBounties: Record<string, BountyPoolExtended> = {
    "0x077d8cc4aa4442deb529cc3165aa5e9b771cf9055e7aeb1febb210aea9788fa4": {
      id: "0x077d8cc4aa4442deb529cc3165aa5e9b771cf9055e7aeb1febb210aea9788fa4",
      balance: "0.21",
      attemptFee: "0.01",
      specUri: "https://example.com/gpt4-jailbreak-spec.json",
      oracleCapId: "0xe12753d9deb0374417fd6697b7888db5393952e9f715b2441d67329e810c90c4",
      submissionCount: 1,
      created: "2024-01-15T10:30:00Z",
      title: "GPT-4 Jailbreak Challenge",
      description: "Find creative ways to bypass GPT-4's safety guardrails and generate prohibited content. Must demonstrate clear policy violations while maintaining coherent responses.",
      category: "jailbreak",
      difficulty: "Hard",
      participants: 15,
      timeRemaining: "5 days",
      featured: true,
      tags: ["prompt-injection", "safety-research", "llm-security"]
    },
    "0x1234567890abcdef1234567890abcdef12345678": {
      id: "0x1234567890abcdef1234567890abcdef12345678",
      balance: "0.50",
      attemptFee: "0.02",
      specUri: "https://example.com/claude-jailbreak-spec.json",
      oracleCapId: "0xabcdef1234567890abcdef1234567890abcdef12",
      submissionCount: 3,
      created: "2024-01-14T15:20:00Z",
      title: "Claude Sonnet Jailbreak",
      description: "Discover vulnerabilities in Claude's constitutional AI training. Focus on prompt injection techniques that bypass harmlessness constraints.",
      category: "jailbreak",
      difficulty: "Medium",
      participants: 8,
      timeRemaining: "3 days",
      featured: false,
      tags: ["constitutional-ai", "alignment", "adversarial"]
    }
  };

  const mockSubmissions: Record<string, Submission[]> = {
    "0x077d8cc4aa4442deb529cc3165aa5e9b771cf9055e7aeb1febb210aea9788fa4": [
      {
        id: "0xe349f43f6c5838b2b7baa4b64ab85c168bab6fc700adf6743c814937384e0d7a",
        hunter: "0x1a1d337e5b1482359cf62bb6cb46213342eb70d69cc1ce440f95de271f2c891c",
        hash: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
        status: "won",
        timestamp: "2024-01-15T11:45:00Z",
        isCurrentUser: walletAddress === "0x1a1d337e5b1482359cf62bb6cb46213342eb70d69cc1ce440f95de271f2c891c"
      }
    ],
    "0x1234567890abcdef1234567890abcdef12345678": [
      {
        id: "0xabc123",
        hunter: "0x456def",
        hash: "b2ca678b4c8c6c8b1b5a4e3f2d1c0b9a8976543210fedcba9876543210fedcba",
        status: "pending",
        timestamp: "2024-01-14T16:30:00Z",
        isCurrentUser: false
      },
      {
        id: "0xdef456",
        hunter: "0x789abc",
        hash: "c3db789c5d9d7d9c2c6b5f4e3e2d1c0b9a8976543210fedcba9876543210fedcba",
        status: "failed",
        timestamp: "2024-01-14T17:15:00Z",
        isCurrentUser: false
      }
    ]
  };

  useEffect(() => {
    if (id && typeof id === "string") {
      fetchBountyData(id);
    }
    
    // Initialize oracle
    if (client) {
      setOracle(new SimpleOracle(client));
    }
  }, [id, client]);

  const fetchBountyData = async (bountyId: string) => {
    try {
      setLoading(true);
      
      // Try to fetch from blockchain first
      try {
        const bountyPool = await suiService.bounty.getBountyPool(bountyId);
        
        if (bountyPool) {
          // Get metadata from localStorage if available
          const userCreatedBounties = JSON.parse(localStorage.getItem("userCreatedBounties") || "[]");
          const localMetadata = userCreatedBounties.find((bounty: any) => bounty.id === bountyId);
          
          const enhancedBounty: BountyPoolExtended = {
            ...bountyPool,
            category: localMetadata?.category || "jailbreak",
            difficulty: localMetadata?.difficulty || "Medium",
            participants: Math.floor(Math.random() * 20) + 1,
            timeRemaining: "5 days",
            featured: Math.random() > 0.5,
            tags: localMetadata?.tags || ["prompt-injection", "safety-research"]
          };
          
          setBounty(enhancedBounty);
          setSubmissions(mockSubmissions[bountyId] || []);
          return;
        }
      } catch (err) {
        console.log("Could not fetch from blockchain, trying mock data:", err);
      }
      
      // Fallback to mock data
      const bountyData = mockBounties[bountyId];
      const submissionData = mockSubmissions[bountyId] || [];

      if (bountyData) {
        setBounty(bountyData);
        setSubmissions(submissionData);
      } else {
        toast.error("Bounty not found");
        router.push("/bounties");
      }
    } catch (error) {
      console.error("Error fetching bounty:", error);
      toast.error("Failed to load bounty data");
    } finally {
      setLoading(false);
    }
  };

  // Oracle processing function
  const processWithOracle = async (submissionText: string, submissionId: string, bounty: BountyPoolExtended) => {
    if (!oracle || !account?.address) {
      console.log("Oracle processing skipped - oracle or account not available");
      return;
    }

    console.log("🔍 Starting oracle processing for:", {
      submissionText,
      submissionId,
      bountyId: bounty.id
    });

    setIsOracleProcessing(true);
    
    try {
      // Try to execute real blockchain payout, fall back to simulation
      const result = await oracle.processWinningSubmission(
        submissionText,
        bounty.id,
        submissionId,
        account.address,
        signAndExecuteTransaction,
        setOracleStatus
      );
      
      console.log("🎯 Oracle processing result:", { 
        success: result.success, 
        realPayout: result.realPayout,
        submissionText 
      });
      
      if (result.success) {
        // Update submission status to won
        setSubmissions(prev => prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: "won" as const }
            : sub
        ));
        
        // Update bounty balance to 0 (prize claimed)
        setBounty(prev => prev ? {
          ...prev,
          balance: "0.0000"
        } : null);
        
        if (result.realPayout) {
          setOracleStatus("✅ Real payout complete! Check your wallet for SUI + NFT!");
          toast.success("🎉 Real blockchain payout! Check your wallet for SUI + NFT!");
        } else {
          setOracleStatus("✅ Demo payout complete! (In real scenario, you'd receive SUI + NFT)");
          toast.success("🎉 Demo win! In real scenario, you'd receive SUI + NFT!");
        }
      } else {
        setOracleStatus("❌ Submission doesn't meet criteria. Try again!");
        
        // Update submission status to failed
        setSubmissions(prev => prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: "failed" as const }
            : sub
        ));
      }
    } catch (error) {
      console.error("Oracle processing failed:", error);
      setOracleStatus("⚠️ Oracle verification failed. Please try again.");
    } finally {
      setIsOracleProcessing(false);
      
      // Clear oracle status after delay
      setTimeout(() => {
        setOracleStatus("");
      }, 5000);
    }
  };

  const handleSubmission = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!bounty) {
      toast.error("Bounty data not loaded");
      return;
    }

    if (!submissionText.trim()) {
      toast.error("Please enter your submission");
      return;
    }

    const attemptFee = parseFloat(bounty.attemptFee);
    if (userBalance < attemptFee) {
      toast.error(`Insufficient balance. You need at least ${formatAttemptFeeToVivon(attemptFee)} VIVON`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create hash of the submission
      const encoder = new TextEncoder();
      const data = encoder.encode(submissionText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const tx = new Transaction();
      
      // Convert attempt fee to MIST
      const attemptFeeMist = Math.floor(attemptFee * 10 ** 9);

      // Split coins for the attempt fee from user's SUI balance
      const [coin] = tx.splitCoins(tx.gas, [attemptFeeMist]);

      // Submit to the bounty pool
      tx.moveCall({
        target: FUNCTION_TARGETS.BOUNTY.SUBMIT(),
        arguments: [
          tx.object(bounty.id),
          tx.pure.vector("u8", hashArray),
          coin,
        ],
      });

      // Set sender
      tx.setSender(account.address);

      // Execute using our service
      const result = await suiService.executeTransaction(tx, signAndExecuteTransaction);

      if (result.success) {
        toast.success("Submission successful! Your attempt has been recorded.");
        
        // Add the new submission to the local state
        const newSubmission: Submission = {
          id: result.digest || Date.now().toString(),
          hunter: account.address,
          hash: hashHex,
          status: "pending",
          timestamp: new Date().toISOString(),
          isCurrentUser: true
        };
        
        setSubmissions(prev => [newSubmission, ...prev]);
        setSubmissionText("");
        setShowSubmissionForm(false);
        
        // Update bounty balance
        setBounty(prev => prev ? {
          ...prev,
          balance: (parseFloat(prev.balance) + attemptFee).toFixed(2),
          submissionCount: prev.submissionCount + 1
        } : null);

        // Start oracle processing
        if (oracle && bounty) {
          processWithOracle(submissionText, newSubmission.id, bounty);
        }
      } else {
        toast.error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Failed to submit attempt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <Trophy className="w-5 h-5 text-green-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending":
      default:
        return <Loader className="w-5 h-5 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "pending":
      default:
        return "text-yellow-400";
    }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper function to convert SUI to VIVON for display
  const formatSuiToVivon = (suiAmount: string | number): string => {
    let amount = typeof suiAmount === 'string' ? parseFloat(suiAmount) : suiAmount;
    
    // Convert from MIST to SUI if needed
    if (amount > 1000000000) {
      amount = amount / 1000000000;
    }
    
    // Convert SUI to VIVON (1 SUI = 100 VIVON)
    const vivonAmount = amount * 100;
    
    return vivonAmount.toFixed(0); // Show whole VIVON amounts
  };

  // Helper function to convert attempt fee to VIVON
  const formatAttemptFeeToVivon = (suiAmount: string | number): string => {
    let amount = typeof suiAmount === 'string' ? parseFloat(suiAmount) : suiAmount;
    
    // Convert from MIST to SUI if needed
    if (amount > 1000000000) {
      amount = amount / 1000000000;
    }
    
    // Convert SUI to VIVON (1 SUI = 100 VIVON)
    const vivonAmount = amount * 100;
    
    return vivonAmount.toFixed(1); // Show 1 decimal for attempt fee
  };

  if (loading) {
    return (
      <main className={cn("relative w-full min-h-screen bg-black", inter.className)}>
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        </div>
        
        <Navigation />
        
        <div className="relative z-10 pt-24 px-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mb-4"></div>
            <p className="text-white/70">Loading bounty details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!bounty) {
    return (
      <main className={cn("relative w-full min-h-screen bg-black", inter.className)}>
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        </div>
        
        <Navigation />
        
        <div className="relative z-10 pt-24 px-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Target className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Bounty Not Found</h2>
            <p className="text-white/70 mb-6">The bounty you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <ActionButton
              label="Back to Bounties"
              isConnected={true}
              isLoading={false}
              onClick={() => router.push("/bounties")}
              buttonClass="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              contentClass="text-white"
            />
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
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-12">
            <button
              onClick={() => router.push("/bounties")}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Bounties
            </button>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-4xl font-bold text-white">
                    {bounty.title}
                  </h1>
                  {bounty.featured && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                      <Star className="w-4 h-4" />
                      Featured
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-white/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(bounty.created)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{bounty.participants} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{bounty.timeRemaining} remaining</span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border",
                    getDifficultyColor(bounty.difficulty || "Medium")
                  )}>
                    {bounty.difficulty}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {formatSuiToVivon(bounty.balance)} VIVON
                </div>
                <div className="text-white/70">Prize Pool</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column - Bounty Details */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* Description */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-semibold text-white mb-6">Description</h2>
                <p className="text-white/80 leading-relaxed text-lg">
                  {bounty.description}
                </p>
                
                {/* Tags */}
                {bounty.tags && bounty.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-white mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {bounty.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Specification */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-semibold text-white mb-6">Specification</h2>
                <div className="flex items-center gap-4 p-6 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">Detailed Requirements</h3>
                    <p className="text-white/70 text-sm">View the complete specification document</p>
                  </div>
                  <a
                    href={bounty.specUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    View Spec
                  </a>
                </div>
              </div>

              {/* Submission Form */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">Submit Attempt</h2>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Shield className="w-4 h-4" />
                    Privacy protected
                  </div>
                </div>
                
                {!showSubmissionForm ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Send className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Ready to submit your attempt?
                    </h3>
                    <p className="text-white/70 mb-6">
                      Your submission will be hashed and stored securely on-chain for verification.
                    </p>
                    
                    <div className="flex items-center justify-center gap-6 text-sm text-white/60 mb-8">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Fee: {bounty.attemptFee} SUI
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Hash-only storage
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Oracle verified
                      </div>
                    </div>
                    
                    {/* Winning Hints */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400 font-medium">Demo Mode - Try These:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {WINNING_SUBMISSIONS.map((hint, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-mono"
                          >
                            &quot;{hint}&quot;
                          </span>
                        ))}
                      </div>
                      <p className="text-blue-300 text-sm mt-4">
                        Submit any of these exact phrases to win the bounty instantly!
                      </p>
                    </div>
                    
                    <ActionButton
                      label="Start Submission"
                      isConnected={!!walletAddress}
                      isLoading={false}
                      onClick={() => setShowSubmissionForm(true)}
                      buttonClass="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      contentClass="text-white"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">Important</span>
                      </div>
                      <p className="text-white/80 text-sm">
                        Only the hash of your submission will be stored on-chain. The actual content remains private until verification.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Your Submission
                      </label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Enter your vulnerability demonstration here... Be specific about the techniques you're using."
                        rows={6}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      
                      {/* Quick Fill Buttons */}
                      <div className="mt-4">
                        <p className="text-sm text-white/60 mb-3">Quick test (click to fill):</p>
                        <div className="flex flex-wrap gap-2">
                          {WINNING_SUBMISSIONS.map((submission, index) => (
                            <button
                              key={index}
                              onClick={() => setSubmissionText(submission)}
                              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-full text-sm font-mono transition-colors"
                            >
                              {submission}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/10">
                      <div>
                        <p className="text-white font-medium">Submission Fee</p>
                        <p className="text-white/60 text-sm">Added to prize pool</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{formatAttemptFeeToVivon(bounty.attemptFee)} VIVON</div>
                        <div className="text-sm text-white/60">
                          Balance: {(userBalance * 100).toFixed(0)} VIVON
                        </div>
                      </div>
                    </div>
                    
                    {/* Oracle Status */}
                    {(isOracleProcessing || oracleStatus) && (
                      <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          {isOracleProcessing ? (
                            <Loader className="w-5 h-5 text-purple-400 animate-spin" />
                          ) : (
                            <Shield className="w-5 h-5 text-purple-400" />
                          )}
                          <span className="text-purple-400 font-medium">Oracle Verification</span>
                        </div>
                        <p className="text-purple-300 text-sm">{oracleStatus}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <ActionButton
                        label="Cancel"
                        isConnected={true}
                        isLoading={false}
                        onClick={() => {
                          setShowSubmissionForm(false);
                          setSubmissionText("");
                          setOracleStatus("");
                        }}
                        buttonClass="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                        contentClass="text-white"
                      />
                      <ActionButton
                        label={isSubmitting ? "Submitting..." : "Submit Attempt"}
                        isConnected={!!walletAddress}
                        isLoading={isSubmitting || isOracleProcessing}
                        disabled={!submissionText.trim() || isSubmitting || isOracleProcessing || userBalance < parseFloat(bounty.attemptFee)}
                        onClick={handleSubmission}
                        buttonClass="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        contentClass="text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Stats and Submissions */}
            <div className="space-y-8">
              
              {/* Stats */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-semibold text-white mb-6">Statistics</h2>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Prize Pool</span>
                    <span className="text-3xl font-bold text-green-400">{formatSuiToVivon(bounty.balance)} VIVON</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Attempt Fee</span>
                    <span className="text-white font-medium">{formatAttemptFeeToVivon(bounty.attemptFee)} VIVON</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Participants</span>
                    <span className="text-white font-medium">{bounty.participants}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Submissions</span>
                    <span className="text-white font-medium">{submissions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Status</span>
                    <span className="text-green-400 font-medium">Active</span>
                  </div>
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">Recent Submissions</h2>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Activity className="w-4 h-4" />
                    <span>Live</span>
                  </div>
                </div>
                
                {submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/70">No submissions yet</p>
                    <p className="text-white/50 text-sm">Be the first to submit!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.slice(0, 10).map((submission) => (
                      <div key={submission.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(submission.status)}
                            <span className={cn("text-sm font-medium", getStatusColor(submission.status))}>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </span>
                          </div>
                          <span className="text-xs text-white/50">
                            {formatDate(submission.timestamp)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-white/60 font-mono truncate">
                            {submission.hash.substring(0, 32)}...
                          </span>
                          <button
                            onClick={() => copyToClipboard(submission.hash)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            {copied ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white/50" />
                            )}
                          </button>
                        </div>
                        
                        {submission.isCurrentUser && (
                          <div className="flex items-center gap-2 text-xs text-blue-400">
                            <Award className="w-3 h-3" />
                            Your submission
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 