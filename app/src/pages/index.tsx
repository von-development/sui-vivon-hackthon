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
  X,
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
  Lightbulb,
  Wrench,
  Sparkles,
  FastForward,
  Eye,
  Hammer,
  Blocks,
  Cog,
  Shield as ShieldIcon,
  Zap as ZapIcon
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Content */}
      <div className="relative z-10 pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Slide 1 - VIVON Introduction */}
          <div className={cn(
            "text-center mb-32 transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-white/60 font-medium">Live on Sui Testnet</span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
                VIVON
              </span>
            </h1>
            
            <div className="mb-12">
              <p className="text-3xl md:text-4xl text-white/90 font-light mb-6 tracking-wide">
                Learn by Doing. <span className="text-purple-400 font-medium">Earn</span> in <span className="text-cyan-400 font-medium">Web3</span>.
              </p>
              
              <div className="max-w-5xl mx-auto">
                <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
                  The first integrated learn-and-earn Web3 ecosystem on the Sui blockchain.
                </p>
                <p className="text-lg md:text-xl text-white/70 mt-4 leading-relaxed">
                  Master <span className="text-blue-400 font-semibold">AI engineering</span>, 
                  <span className="text-purple-400 font-semibold"> cybersecurity</span>, and 
                  <span className="text-cyan-400 font-semibold"> Web3 development</span> while earning VIVON tokens and NFT badges.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={() => router.push("/challenges")}
                className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl font-bold text-white text-lg transition-all duration-500 hover:scale-105 shadow-2xl"
              >
                <div className="relative flex items-center gap-3">
                  <Play className="w-6 h-6" />
                  <span>Start Learning & Earning</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
              
              <button 
                onClick={() => router.push("/bounties")}
                className="group relative px-12 py-6 bg-transparent border-2 border-white/20 rounded-2xl font-bold text-white/90 text-lg transition-all duration-500 hover:border-purple-400 hover:text-white hover:scale-105 hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  <span>Explore Bounties</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Slide 2 - The Pain Point */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="max-w-5xl mx-auto text-center">
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-3xl p-12 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">The Pain Point</h2>
                </div>
                
                <p className="text-2xl md:text-3xl text-white/90 font-light leading-relaxed mb-8">
                  Web3 and AI learning is <span className="text-red-400 font-bold">fragmented</span> and mostly <span className="text-red-400 font-bold">theoretical</span>.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <X className="w-5 h-5 text-red-400" />
                      <span className="text-lg font-semibold text-white">No real incentives to practice</span>
                    </div>
                    <p className="text-white/70">Students invest time learning but get no tangible rewards</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <X className="w-5 h-5 text-red-400" />
                      <span className="text-lg font-semibold text-white">Hard to prove practical skills</span>
                    </div>
                    <p className="text-white/70">No way to showcase real Web3 development abilities</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <X className="w-5 h-5 text-red-400" />
                      <span className="text-lg font-semibold text-white">Bounties, learning, and rewards are scattered</span>
                    </div>
                    <p className="text-white/70">Everything is fragmented across different platforms</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <X className="w-5 h-5 text-red-400" />
                      <span className="text-lg font-semibold text-white">Theoretical only learning</span>
                    </div>
                    <p className="text-white/70">Most platforms teach concepts without practical application</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 3 - Current Problems */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Current Problems</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                The Web3 education landscape is broken in fundamental ways
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: BookOpen,
                  title: "Theoretical Only",
                  description: "No hands-on practice",
                  color: "from-red-500/20 to-orange-500/20",
                  borderColor: "border-red-500/30"
                },
                {
                  icon: DollarSign,
                  title: "No Economic Reward",
                  description: "For learning progress",
                  color: "from-orange-500/20 to-yellow-500/20",
                  borderColor: "border-orange-500/30"
                },
                {
                  icon: Layers,
                  title: "No Single Ecosystem",
                  description: "Everything scattered",
                  color: "from-yellow-500/20 to-red-500/20",
                  borderColor: "border-yellow-500/30"
                },
                {
                  icon: ShieldIcon,
                  title: "No Skill Verification",
                  description: "Or on-chain proof",
                  color: "from-red-500/20 to-pink-500/20",
                  borderColor: "border-pink-500/30"
                }
              ].map((problem, index) => (
                <div key={index} className={cn(
                  "bg-white/5 backdrop-blur-sm border-2 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300",
                  `bg-gradient-to-br ${problem.color} ${problem.borderColor}`
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <X className="w-6 h-6 text-red-400" />
                    <problem.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{problem.title}</h3>
                  <p className="text-white/70 leading-relaxed">{problem.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Slide 4 - Market Context */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-3xl p-12 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">Market Context</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white/5 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Current Players</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-blue-400" />
                        <span className="text-white/80"><strong>Coursera, Udemy:</strong> theory only</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-400" />
                        <span className="text-white/80"><strong>HackerOne:</strong> only for security bounties</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">The Gap</h3>
                    <p className="text-white/80">
                      No platform combines learning + real bounties + token economy + NFT skill badges in a Web3-native system.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6">
                  <p className="text-xl text-cyan-200 font-semibold text-center">
                    <span className="text-cyan-400">VIVON</span> is the first to unite all these elements in one comprehensive Web3 ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 5 - Our Solution */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-3xl p-12 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">Our Solution</h2>
                </div>
                
                <div className="text-center mb-12">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    VIVON = <span className="text-blue-400">Learn</span> + <span className="text-purple-400">Do</span> + <span className="text-green-400">Earn</span>
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Hands-on Challenges</h4>
                    <p className="text-white/70 text-sm">AI, Security, Web3</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Real Bounties</h4>
                    <p className="text-white/70 text-sm">With real VIVON token rewards</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Skill Achievements</h4>
                    <p className="text-white/70 text-sm">As NFTs on-chain</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">All on Sui</h4>
                    <p className="text-white/70 text-sm">Blockchain</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 6 - How It Works */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-600",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How It Works</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                A comprehensive ecosystem that rewards learning and skill development
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Multi-category bounty system</h3>
                </div>
                <p className="text-white/70 mb-4">
                  AI jailbreaks, security hacks, DeFi, gaming challenges with real rewards
                </p>
                <button 
                  onClick={() => router.push("/bounties")}
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Explore Bounties →
                </button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Instant token rewards</h3>
                </div>
                <p className="text-white/70 mb-4">
                  Oracles verify results, pay you automatically in VIVON tokens
                </p>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="text-green-400 hover:text-green-300 transition-colors font-medium"
                >
                  View Dashboard →
                </button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">NFT badges</h3>
                </div>
                <p className="text-white/70 mb-4">
                  Proof of skills for future jobs, stored permanently on-chain
                </p>
                <button 
                  onClick={() => router.push("/profile")}
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  View Profile →
                </button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Integrated dashboard</h3>
                </div>
                <p className="text-white/70 mb-4">
                  Profile, balance, transactions - everything in one place
                </p>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  Open Dashboard →
                </button>
              </div>
            </div>
          </div>

          {/* Slide 7 - Tech Highlights */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Tech Highlights</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Built on cutting-edge blockchain technology with real deployed smart contracts
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  Built on Sui Blockchain
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Real smart contracts deployed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Parallel object model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Gas-efficient operations</span>
                  </div>
                </div>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-xs mt-4">
                  <div className="text-green-400">Package ID:</div>
                  <div className="text-white/80 break-all">0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7</div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  VIVON Token
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Native supply management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">DEX swaps with SUI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Time-locked rewards</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  Move Language
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">vivon::mint() - Token creation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">bounty::create_pool() - Escrow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">bounty::submit() - Submissions</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  Oracle Verified Payouts
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">No manual middleman</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Automated verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Instant rewards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 8 - Security */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-800",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-2 border-green-500/30 rounded-3xl p-12 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">Security</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-green-400" />
                      <h3 className="text-lg font-bold text-white">Hash-based submissions</h3>
                    </div>
                    <p className="text-white/70">Keep IP safe until approved</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="w-6 h-6 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">Shared bounty pools</h3>
                    </div>
                    <p className="text-white/70">Multiple users work in parallel</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Cog className="w-6 h-6 text-purple-400" />
                      <h3 className="text-lg font-bold text-white">Capability-based oracle</h3>
                    </div>
                    <p className="text-white/70">Secure access controls</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-6 h-6 text-yellow-400" />
                      <h3 className="text-lg font-bold text-white">Economic security</h3>
                    </div>
                    <p className="text-white/70">Via attempt fees</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 9 - AI Helper Ecosystem */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-900",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-3xl p-12 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">AI Helper Ecosystem</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Database className="w-6 h-6 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">Sui blockchain AI guide</h3>
                    </div>
                    <p className="text-white/70">Expert assistance for blockchain development</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Code2 className="w-6 h-6 text-green-400" />
                      <h3 className="text-lg font-bold text-white">Smart contract code examples</h3>
                    </div>
                    <p className="text-white/70">Real Move code snippets and patterns</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="w-6 h-6 text-purple-400" />
                      <h3 className="text-lg font-bold text-white">Personalized learning paths</h3>
                    </div>
                    <p className="text-white/70">Tailored to your skill level and goals</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="w-6 h-6 text-cyan-400" />
                      <h3 className="text-lg font-bold text-white">Community challenge hints</h3>
                    </div>
                    <p className="text-white/70">Contextual help for bounties and challenges</p>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <button 
                    onClick={() => router.push("/ai-helpers")}
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5" />
                      <span>Try AI Assistant</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 10 - What's Next */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">What's Next</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Expanding the ecosystem to transform Web3 education globally
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Rocket,
                  title: "Deploy to Sui Mainnet",
                  description: "Production deployment for real-world usage",
                  color: "from-blue-500/20 to-cyan-500/20"
                },
                {
                  icon: GraduationCap,
                  title: "Partner with Universities",
                  description: "Integration with coding bootcamps and educational institutions",
                  color: "from-purple-500/20 to-pink-500/20"
                },
                {
                  icon: Wrench,
                  title: "Add New Challenge Categories",
                  description: "Smart contracts, MEV, and advanced Web3 topics",
                  color: "from-green-500/20 to-emerald-500/20"
                },
                {
                  icon: Building,
                  title: "Build Employer Dashboard",
                  description: "Skill verification system for hiring managers",
                  color: "from-yellow-500/20 to-orange-500/20"
                },
                {
                  icon: Users,
                  title: "Launch VIVON DAO",
                  description: "Community governance for platform evolution",
                  color: "from-indigo-500/20 to-purple-500/20"
                }
              ].map((step, index) => (
                <div key={index} className={cn(
                  "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300",
                  `bg-gradient-to-br ${step.color}`
                )}>
                  <step.icon className="w-8 h-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Slide 11 - Pitch Line */}
          <div className={cn(
            "mb-32 transition-all duration-1000 delay-1100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-3xl p-12 backdrop-blur-sm text-center">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">Pitch Line</h2>
                </div>
                
                <div className="mb-8">
                  <p className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
                    <span className="text-cyan-400">VIVON:</span> The first real learn-by-doing platform where you build skills, prove them on-chain, and get paid.
                  </p>
                  
                  <p className="text-xl md:text-2xl text-white/90 font-light">
                    Start Learning. Start Earning. Join the <span className="text-purple-400 font-semibold">VIVON Web3 revolution</span>.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button 
                    onClick={() => router.push("/challenges")}
                    className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl font-bold text-white text-lg transition-all duration-500 hover:scale-105 shadow-2xl"
                  >
                    <div className="relative flex items-center gap-3">
                      <Play className="w-6 h-6" />
                      <span>Start Your Journey</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push("/ai-helpers")}
                    className="group relative px-12 py-6 bg-transparent border-2 border-white/20 rounded-2xl font-bold text-white/90 text-lg transition-all duration-500 hover:border-cyan-400 hover:text-white hover:scale-105 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="w-6 h-6" />
                      <span>Try AI Assistant</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="border-t border-white/10 pt-8">
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
