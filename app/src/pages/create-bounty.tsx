import { useState, useContext, useMemo } from "react";
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
import { SuiService } from "@/services/suiService";
import { useUserStore } from "@/stores/useUserStore";
import Navigation from "@/components/navigation";
import BasicInputField from "@/components/fields/basicInputField";
import ActionButton from "@/components/buttons/actionButton";
import { ArrowLeft, Target, DollarSign, Shield, Info, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { FUNCTION_TARGETS } from "@/constants/contractConstants";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface CreateBountyFormData {
  title: string;
  description: string;
  specUri: string;
  initialFunding: string;
  attemptFee: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
}

export default function CreateBounty() {
  const router = useRouter();
  const { walletAddress } = useContext(AppContext);
  const { network } = useUserStore();
  const [account] = useAccounts();
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);

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

  // Helper functions to convert SUI to VIVON for display
  const formatSuiToVivon = (suiAmount: string | number): string => {
    let amount = typeof suiAmount === 'string' ? parseFloat(suiAmount) : suiAmount;
    
    // Convert SUI to VIVON (1 SUI = 100 VIVON)
    const vivonAmount = amount * 100;
    
    return vivonAmount.toFixed(0); // Show whole VIVON amounts
  };

  const formatSuiBalanceToVivon = (suiBalance: number): string => {
    // Convert SUI to VIVON (1 SUI = 100 VIVON)
    const vivonAmount = suiBalance * 100;
    
    return vivonAmount.toFixed(0); // Show whole VIVON amounts
  };

  // Form state
  const [formData, setFormData] = useState<CreateBountyFormData>({
    title: "",
    description: "",
    specUri: "",
    initialFunding: "0.1",
    attemptFee: "0.01",
    category: "jailbreak",
    difficulty: "Medium",
    tags: [],
  });

  const categories = [
    { id: "jailbreak", label: "AI Jailbreak", icon: Shield },
    { id: "security", label: "Security", icon: Shield },
    { id: "defi", label: "DeFi", icon: DollarSign },
    { id: "gaming", label: "Gaming", icon: Target },
  ];

  const difficulties = [
    { id: "Easy", label: "Easy", color: "text-green-400" },
    { id: "Medium", label: "Medium", color: "text-yellow-400" },
    { id: "Hard", label: "Hard", color: "text-red-400" },
  ];

  const availableTags = [
    "prompt-injection", "alignment", "constitutional-ai", "safety-research", 
    "llm-security", "adversarial", "red-teaming", "vulnerability-assessment"
  ];

  // Validation
  const isFormValid = useMemo(() => {
    return (
      formData.title.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.specUri.trim() !== "" &&
      parseFloat(formData.initialFunding) > 0 &&
      parseFloat(formData.attemptFee) > 0 &&
      parseFloat(formData.initialFunding) + parseFloat(formData.attemptFee) <= userBalance
    );
  }, [formData, userBalance]);

  const handleInputChange = (field: keyof CreateBountyFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleCreateBounty = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isFormValid) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    setIsLoading(true);

    try {
      // Use the BountyService to create the transaction
      const tx = suiService.bounty.createBountyPoolTransaction(
        account.address,
        formData.initialFunding,
        formData.attemptFee,
        formData.specUri
      );

      console.log("Transaction created:", tx);
      console.log("Form data:", formData);
      console.log("Account:", account?.address);
      console.log("Network:", network);

      // Execute the transaction using the callback pattern
      signAndExecuteTransaction({
        transaction: tx,
      }, {
        onSuccess: (txResult) => {
          console.log("Transaction successful:", txResult);
          
          // Check if we have a digest
          if (txResult.digest) {
            toast.success(`Bounty pool created successfully! TX: ${txResult.digest.slice(0, 8)}...`);
          } else {
            toast.success("Bounty pool created successfully!");
          }

          // Store basic bounty info
          const existingBounties = JSON.parse(localStorage.getItem("userCreatedBounties") || "[]");
          const newBounty = {
            id: `temp-${Date.now()}`,
            title: formData.title,
            description: formData.description,
            specUri: formData.specUri,
            category: formData.category,
            difficulty: formData.difficulty,
            tags: formData.tags,
            created: new Date().toISOString(),
            initialFunding: formData.initialFunding,
            attemptFee: formData.attemptFee,
            digest: txResult.digest,
            status: "completed"
          };
          
          existingBounties.push(newBounty);
          localStorage.setItem("userCreatedBounties", JSON.stringify(existingBounties));
          
          setIsLoading(false);
          
          // Navigate to bounties page
          setTimeout(() => {
            router.push("/bounties");
          }, 1000);
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          toast.error(error instanceof Error ? error.message : "Transaction failed");
          setIsLoading(false);
        }
      });
      
      // Return early since we're using callbacks
      return;
    } catch (error) {
      console.error("Error creating bounty:", error);
      
      // More detailed error handling
      if (error instanceof Error) {
        toast.error(`Failed to create bounty pool: ${error.message}`);
      } else if (typeof error === 'string') {
        toast.error(`Failed to create bounty pool: ${error}`);
      } else {
        toast.error("Failed to create bounty pool: Unknown error");
      }
      
      // Log the full error for debugging
      console.error("Full error details:", {
        error,
        formData,
        account: account?.address,
        network
      });
    } finally {
      setIsLoading(false);
    }
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
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-12">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Bounties
            </button>
            
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-6">
                Create Bounty Pool
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Create a new bounty pool to incentivize security researchers to find 
                vulnerabilities in your AI model. Set your prize money and submission fee.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              
              {/* Left Column - Form Fields */}
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Bounty Details</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Bounty Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., GPT-4 Jailbreak Challenge"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleInputChange("category", category.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                          formData.category === category.id
                            ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        )}
                      >
                        <category.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-3">
                    {difficulties.map((difficulty) => (
                      <button
                        key={difficulty.id}
                        type="button"
                        onClick={() => handleInputChange("difficulty", difficulty.id as any)}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-lg border transition-all duration-200",
                          formData.difficulty === difficulty.id
                            ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        )}
                      >
                        <span className={cn("font-medium", difficulty.color)}>{difficulty.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the AI model, what kind of vulnerabilities you're looking for, and any specific requirements..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Specification URI
                  </label>
                  <input
                    type="url"
                    value={formData.specUri}
                    onChange={(e) => handleInputChange("specUri", e.target.value)}
                    placeholder="https://example.com/bounty-spec.json"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-white/60 mt-1">
                    Link to detailed specifications, rules, and testing criteria
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.filter(tag => !formData.tags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="px-3 py-1 bg-white/5 text-white/70 rounded-full text-sm hover:bg-white/10 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Initial Funding (VIVON)
                    </label>
                    <BasicInputField
                      label=""
                      inputValue={formatSuiToVivon(formData.initialFunding)}
                      setInputValue={(value) => handleInputChange("initialFunding", (parseFloat(value) / 100).toString())}
                      tokenInfo={["VIVON"]}
                      canSelectToken={false}
                      selectedToken="VIVON"
                      setSelectedToken={() => {}}
                      maxValue={userBalance * 100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Attempt Fee (VIVON)
                    </label>
                    <BasicInputField
                      label=""
                      inputValue={formatSuiToVivon(formData.attemptFee)}
                      setInputValue={(value) => handleInputChange("attemptFee", (parseFloat(value) / 100).toString())}
                      tokenInfo={["VIVON"]}
                      canSelectToken={false}
                      selectedToken="VIVON"
                      setSelectedToken={() => {}}
                      maxValue={userBalance * 100}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Info Cards */}
              <div className="p-8 bg-white/5 border-l border-white/10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Information</h3>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-blue-400" />
                    <h4 className="text-lg font-semibold text-white">How It Works</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li>• Security researchers submit vulnerability attempts</li>
                    <li>• Each attempt requires paying the attempt fee</li>
                    <li>• Attempt fees are added to the prize pool</li>
                    <li>• Oracle verifies successful discoveries</li>
                    <li>• Winner takes the entire pool + mints NFT badge</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    <h4 className="text-lg font-semibold text-white">Prize Pool</h4>
                  </div>
                  <div className="space-y-2 text-sm text-white/80">
                    <div className="flex justify-between">
                      <span>Initial Funding:</span>
                      <span className="text-white">{formatSuiToVivon(formData.initialFunding)} VIVON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attempt Fee:</span>
                      <span className="text-white">{formatSuiToVivon(formData.attemptFee)} VIVON</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Starting Pool:</span>
                      <span className="text-green-400">{formatSuiToVivon(formData.initialFunding)} VIVON</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-purple-400" />
                    <h4 className="text-lg font-semibold text-white">Security Features</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li>• Submissions stored as hashes only</li>
                    <li>• Oracle-verified payouts</li>
                    <li>• Transparent on-chain records</li>
                    <li>• Automatic escrow system</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-blue-400" />
                    <h4 className="text-lg font-semibold text-white">Demo Oracle</h4>
                  </div>
                  <div className="space-y-2 text-sm text-white/80">
                    <p>For testing, the oracle automatically approves these submissions:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono">&quot;12345678&quot;</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono">&quot;hello world&quot;</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono">&quot;jailbreak&quot;</span>
                    </div>
                    <p className="text-xs text-blue-300 mt-2">
                      Submit any of these exact phrases to win instantly!
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-6 h-6 text-yellow-400" />
                    <h4 className="text-lg font-semibold text-white">Your Balance</h4>
                  </div>
                  <div className="space-y-2 text-sm text-white/80">
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="text-white">{formatSuiBalanceToVivon(userBalance)} VIVON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Required:</span>
                      <span className="text-white">{formatSuiToVivon(parseFloat(formData.initialFunding) + parseFloat(formData.attemptFee))} VIVON</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>After Creation:</span>
                      <span className={`${userBalance - parseFloat(formData.initialFunding) - parseFloat(formData.attemptFee) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatSuiBalanceToVivon(userBalance - parseFloat(formData.initialFunding) - parseFloat(formData.attemptFee))} VIVON
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-8 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isFormValid ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  )}
                  <div>
                    <div className="text-white font-medium">
                      {isFormValid ? "Ready to create" : "Please complete the form"}
                    </div>
                    <div className="text-sm text-white/60">
                      {isFormValid 
                        ? "All fields are correctly filled" 
                        : "Fill in all required fields and ensure sufficient balance"
                      }
                    </div>
                  </div>
                </div>
                <ActionButton
                  label={isLoading ? "Creating Bounty..." : "Create Bounty Pool"}
                  isConnected={!!walletAddress}
                  isLoading={isLoading}
                  disabled={!isFormValid || isLoading}
                  onClick={handleCreateBounty}
                  buttonClass="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  contentClass="text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 