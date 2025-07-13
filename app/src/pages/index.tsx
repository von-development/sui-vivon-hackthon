import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import { useContext, useState, useEffect } from "react";
import { AppContext } from "@/context/AppContext";
import { 
  ArrowRight, 
  Zap, 
  Trophy,
  Target,
  Shield,
  Code2,
  Gamepad2,
  Cpu,
  Award,
  Users,
  TrendingUp,
  Star,
  Play,
  Activity,
  Globe,
  Lock,
  Unlock,
  Brain,
  Rocket,
  Coins,
  Database,
  Bot,
  BookOpen,
  Timer,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Layers,
  GitBranch,
  Settings,
  BarChart3,
  PieChart,
  Wallet,
  Link,
  Briefcase,
  GraduationCap,
  Building,
  TrendingDown,
  X,
  Lightbulb,
  Wrench
} from "lucide-react";
import { useRouter } from "next/router";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { walletAddress } = useContext(AppContext);
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className={cn("relative w-full min-h-screen bg-black", inter.className)}>
      {/* Enhanced Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}>
        </div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Content */}
      <div className="relative z-10 pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          
          {/* 1. Introduction */}
          <div className={cn(
            "text-center mb-20 transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-white/60 font-medium">Live on Sui Testnet</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
                VIVON
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/90 font-light mb-8 tracking-wide">
              Learn by Doing. <span className="text-purple-400">Earn</span> in <span className="text-cyan-400">Web3</span>.
            </p>
            
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-xl md:text-2xl font-medium text-white mb-6 leading-tight">
                The first integrated learn-and-earn Web3 ecosystem on Sui blockchain where users master 
                <span className="text-blue-400"> AI engineering</span>, 
                <span className="text-purple-400"> cybersecurity</span>, and 
                <span className="text-cyan-400"> Web3 development</span> while earning real VIVON tokens and NFT achievements.
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={() => router.push("/challenges")}
                className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl font-semibold text-white transition-all duration-500 hover:scale-105 shadow-2xl"
              >
                <div className="relative flex items-center gap-3">
                  <Play className="w-6 h-6" />
                  <span className="text-lg">Start Learning & Earning</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
              
              <button 
                onClick={() => router.push("/bounties")}
                className="group relative px-10 py-5 bg-transparent border-2 border-white/20 rounded-2xl font-semibold text-white/90 transition-all duration-500 hover:border-purple-400 hover:text-white hover:scale-105 hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  <span className="text-lg">Explore Bounties</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* 2. Pain Point */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <h3 className="text-3xl font-bold text-white">The Pain Point</h3>
              </div>
              <p className="text-lg text-white/80 leading-relaxed">
                Learning Web3 and AI technologies is <span className="text-red-400 font-semibold">fragmented</span>, 
                <span className="text-red-400 font-semibold"> theoretical</span>, and lacks real incentives - 
                students can't practice hands-on skills while earning meaningful rewards for their progress.
              </p>
            </div>
          </div>

          {/* 3. Problems */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">Current Problems</h3>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: BookOpen,
                  title: "Theoretical Learning Only",
                  description: "Most platforms teach concepts without practical application",
                  color: "from-red-500/20 to-orange-500/20"
                },
                {
                  icon: TrendingDown,
                  title: "No Economic Incentives",
                  description: "Students invest time learning but get no tangible rewards",
                  color: "from-orange-500/20 to-yellow-500/20"
                },
                {
                  icon: Layers,
                  title: "Fragmented Ecosystem",
                  description: "Bounties, learning, and rewards are scattered across different platforms",
                  color: "from-yellow-500/20 to-red-500/20"
                },
                {
                  icon: X,
                  title: "No Skill Verification",
                  description: "Hard to prove and showcase practical Web3 skills",
                  color: "from-red-500/20 to-pink-500/20"
                }
              ].map((problem, index) => (
                <div key={index} className={cn(
                  "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300",
                  "bg-gradient-to-br", problem.color
                )}>
                  <problem.icon className="w-8 h-8 text-red-400 mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-3">{problem.title}</h4>
                  <p className="text-white/70 text-sm leading-relaxed">{problem.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Market Context */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                <h3 className="text-3xl font-bold text-white">Market Context</h3>
              </div>
              <p className="text-lg text-white/80 leading-relaxed mb-6">
                Current education platforms (Coursera, Udemy) focus on theory. Bug bounty platforms (HackerOne) focus on security only.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <p className="text-lg text-blue-200 font-medium">
                  <span className="text-cyan-400">No platform</span> combines hands-on learning + real bounties + token economy + NFT achievements in one Web3-native ecosystem.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Solution */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-8 max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <Lightbulb className="w-8 h-8 text-green-400" />
                <h3 className="text-3xl font-bold text-white">Our Solution</h3>
              </div>
              <p className="text-xl text-white/90 leading-relaxed">
                VIVON creates the <span className="text-green-400 font-semibold">first integrated learn-and-earn Web3 ecosystem</span> where users master real skills through challenges, contribute to bounties, and build wealth in VIVON tokens - all on Sui blockchain.
              </p>
            </div>
          </div>

          {/* 6. Complete Feature Set */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-600",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">Complete Feature Set</h3>
              <p className="text-lg text-white/70">Comprehensive Web3 ecosystem with real blockchain integration</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "Multi-Category Bounty System",
                  description: "AI Jailbreak, Security, DeFi, Gaming bounties • Real VIVON token rewards • Oracle-verified automatic payouts",
                  color: "from-blue-500/20 to-cyan-500/20",
                  link: "/bounties"
                },
                {
                  icon: Gamepad2,
                  title: "Interactive Challenge System",
                  description: "AI engineering practice quests • Cybersecurity hands-on challenges • Web3 development tutorials • 5-minute quests with instant VIVON rewards",
                  color: "from-purple-500/20 to-pink-500/20",
                  link: "/challenges"
                },
                {
                  icon: Bot,
                  title: "AI Helper Ecosystem",
                  description: "Sui blockchain development assistant • Interactive AI for learning support • Technical guidance and code help",
                  color: "from-green-500/20 to-emerald-500/20",
                  link: "/ai-helpers"
                },
                {
                  icon: Coins,
                  title: "Complete Token Economy",
                  description: "Native VIVON token (10M supply, 9 decimals) • Real DEX with SUI ↔ VIVON swaps • MintCapability for controlled distribution • Time-locked rewards",
                  color: "from-yellow-500/20 to-orange-500/20",
                  link: "/dashboard"
                },
                {
                  icon: Award,
                  title: "NFT Achievement System",
                  description: "Winner badges for bounty success • Edition-based collectibles • Permanent skill verification on-chain",
                  color: "from-indigo-500/20 to-purple-500/20",
                  link: "/profile"
                },
                {
                  icon: BarChart3,
                  title: "Integrated Dashboard",
                  description: "Profile management with all balances • Transaction monitoring and history • Network switching (testnet/mainnet) • Real-time blockchain event tracking",
                  color: "from-pink-500/20 to-rose-500/20",
                  link: "/dashboard"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  onClick={() => router.push(feature.link)}
                  className={cn(
                    "group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-500 hover:scale-105 cursor-pointer",
                    `bg-gradient-to-br ${feature.color}`
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-4">{feature.title}</h4>
                  <p className="text-white/70 leading-relaxed text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Sui Blockchain Technical Highlights */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">
                Sui Blockchain Technical Highlights
              </h3>
              <p className="text-lg text-white/70">Advanced object-based architecture with real deployed smart contracts</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  Smart Contract Package
                </h4>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm mb-4">
                  <div className="text-green-400">Package ID:</div>
                  <div className="text-white/80 break-all">0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Deployed on Sui Testnet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Object-based architecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Move programming language</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  Core Functions
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">vivon::mint() - Controlled token minting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">bounty::create_pool() - Automated escrow system</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">bounty::submit() - Hash-based secure submissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">vivon_nft::mint_holder_badge() - Achievement NFTs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Oracle verification with Move contracts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Sui Features */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8">
              <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <Cpu className="w-6 h-6 text-blue-400" />
                Advanced Sui Architecture
              </h4>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    Object Model
                  </h5>
                  <div className="space-y-2 text-sm text-white/80">
                    <div>• <span className="text-cyan-400">BountyPool</span> (shared) - Parallel submissions</div>
                    <div>• <span className="text-green-400">Submission</span> (owned) - User assets</div>
                    <div>• <span className="text-purple-400">OracleCap</span> (owned) - Access control</div>
                    <div>• <span className="text-yellow-400">VivonNFT</span> (owned) - Collectibles</div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Parallelism & Performance
                  </h5>
                  <div className="space-y-2 text-sm text-white/80">
                    <div>• Multiple users submit to bounties simultaneously</div>
                    <div>• Independent bounty pools operate in parallel</div>
                    <div>• Non-blocking NFT minting operations</div>
                    <div>• Gas-efficient object sharing patterns</div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Security Implementation
                  </h5>
                  <div className="space-y-2 text-sm text-white/80">
                    <div>• <span className="text-green-400">Hash-based submissions</span> protect IP</div>
                    <div>• <span className="text-blue-400">Capability-based</span> oracle system</div>
                    <div>• <span className="text-purple-400">Multi-level access</span> control</div>
                    <div>• <span className="text-yellow-400">Economic security</span> via fees</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-black/30 rounded-lg p-4 font-mono text-sm">
                <div className="text-cyan-400 mb-2">// Actual VIVON BountyPool Structure</div>
                <div className="text-white/80">
                  <div className="text-purple-400">public struct</div> <span className="text-blue-400">BountyPool</span> <span className="text-white">has</span> <span className="text-green-400">key</span> {'{'}
                </div>
                <div className="text-white/80 ml-4">
                  <div><span className="text-orange-400">id</span>: <span className="text-blue-400">UID</span>,</div>
                  <div><span className="text-orange-400">balance</span>: <span className="text-blue-400">Balance</span>&lt;<span className="text-purple-400">SUI</span>&gt;,</div>
                  <div><span className="text-orange-400">attempt_fee</span>: <span className="text-blue-400">u64</span>,</div>
                  <div><span className="text-orange-400">spec_uri</span>: <span className="text-blue-400">vector</span>&lt;<span className="text-purple-400">u8</span>&gt;,</div>
                  <div><span className="text-orange-400">oracle_cap_id</span>: <span className="text-blue-400">ID</span></div>
                </div>
                <div className="text-white/80">{'}'}</div>
                <div className="text-gray-400 mt-2 text-xs">// Shared object enables parallel submissions from multiple researchers</div>
              </div>
            </div>
          </div>

          {/* AI Helpers Section */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-750",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">
                AI Helpers for Development & Learning
              </h3>
              <p className="text-lg text-white/70">Integrated AI assistance for Sui blockchain development</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div 
                onClick={() => router.push("/ai-helpers")}
                className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-all duration-300 cursor-pointer hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white">Sui AI Assistant</h4>
                    <p className="text-purple-300 text-sm">Interactive blockchain development guide</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all ml-auto" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-medium mb-1">Smart Contract Guidance</h5>
                      <p className="text-white/70 text-sm">Get help with Move programming, object design, and Sui-specific patterns</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Code2 className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-medium mb-1">Code Examples & Snippets</h5>
                      <p className="text-white/70 text-sm">Access curated code examples for common Sui development patterns</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-medium mb-1">Learning Path Recommendations</h5>
                      <p className="text-white/70 text-sm">Personalized learning recommendations based on your skill level</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  Community Features
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-gold-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-medium mb-1">Peer Learning</h5>
                      <p className="text-white/70 text-sm">Connect with other developers and share knowledge</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-medium mb-1">Challenge Hints</h5>
                      <p className="text-white/70 text-sm">Get contextual hints for bounties and coding challenges</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-medium mb-1">Documentation Integration</h5>
                      <p className="text-white/70 text-sm">Seamless access to Sui documentation and best practices</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm text-green-200 font-medium">
                    💡 Pro Tip: Use the AI assistant to debug your Move code and understand Sui object relationships
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 8. Pitch Line */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-800",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4">Pitch Line</h3>
            </div>
          </div>

          {/* 9. Next Steps */}
          <div className={cn(
            "mb-20 transition-all duration-1000 delay-900",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">Next Steps</h3>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Rocket,
                  title: "Deploy to Sui Mainnet",
                  description: "Production deployment for real-world usage"
                },
                {
                  icon: GraduationCap,
                  title: "Partner with Universities",
                  description: "Integration with coding bootcamps and educational institutions"
                },
                {
                  icon: Wrench,
                  title: "Expand Challenge Categories",
                  description: "Add smart contracts, MEV, and advanced Web3 topics"
                },
                {
                  icon: Building,
                  title: "Employer Dashboard",
                  description: "Skill verification system for hiring managers"
                },
                {
                  icon: Users,
                  title: "Launch VIVON DAO",
                  description: "Community governance for platform evolution"
                }
              ].map((step, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <step.icon className="w-8 h-8 text-cyan-400 mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-3">{step.title}</h4>
                  <p className="text-white/70 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className={cn(
            "text-center transition-all duration-1000 delay-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <button 
              onClick={() => router.push("/challenges")}
              className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl font-bold text-white text-lg transition-all duration-500 hover:scale-105 shadow-2xl"
            >
              <div className="relative flex items-center gap-4">
                <Play className="w-6 h-6" />
                <span>Experience VIVON Now</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </div>

          {/* Status Bar */}
          <div className="mt-20 border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-white/50 text-sm">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live on Sui Testnet</span>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Network: Sui</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <span>Token: VIVON</span>
                </div>
                <div className="flex items-center gap-2">
                  {walletAddress ? (
                    <>
                      <Unlock className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400">Connect Wallet</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
