import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import { useContext, useState } from "react";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/router";
import ActionButton from "@/components/buttons/actionButton";
import { 
  Target, 
  Code2, 
  Shield, 
  Gamepad2, 
  Trophy, 
  BookOpen, 
  Star, 
  Users, 
  Clock,
  Award,
  ArrowRight,
  Zap,
  ChevronRight,
  Play,
  Lock,
  CheckCircle
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: "security" | "defi" | "gaming" | "jailbreak";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  participants: number;
  reward: number;
  isLocked: boolean;
  isCompleted: boolean;
  featured: boolean;
  tags: string[];
}

const mockChallenges: Challenge[] = [
  {
    id: "1",
    title: "AI Safety Fundamentals",
    description: "Learn the basics of AI safety and alignment through interactive challenges",
    category: "security",
    difficulty: "Beginner",
    duration: "30 min",
    participants: 1250,
    reward: 100,
    isLocked: false,
    isCompleted: false,
    featured: true,
    tags: ["AI Safety", "Fundamentals", "Introduction"]
  },
  {
    id: "2", 
    title: "Jailbreak Detection",
    description: "Master the art of detecting and preventing AI jailbreaks",
    category: "jailbreak",
    difficulty: "Intermediate",
    duration: "45 min",
    participants: 890,
    reward: 250,
    isLocked: false,
    isCompleted: true,
    featured: false,
    tags: ["Jailbreak", "Detection", "Security"]
  },
  {
    id: "3",
    title: "DeFi Security Audit",
    description: "Advanced smart contract security analysis and vulnerability assessment",
    category: "defi",
    difficulty: "Advanced",
    duration: "90 min",
    participants: 340,
    reward: 500,
    isLocked: false,
    isCompleted: false,
    featured: false,
    tags: ["DeFi", "Security", "Smart Contracts"]
  },
  {
    id: "4",
    title: "Gaming Economy Design",
    description: "Design and implement secure gaming economies with token mechanics",
    category: "gaming",
    difficulty: "Intermediate",
    duration: "60 min",
    participants: 567,
    reward: 300,
    isLocked: true,
    isCompleted: false,
    featured: false,
    tags: ["Gaming", "Economy", "Tokens"]
  }
];

export default function Challenges() {
  const { walletAddress } = useContext(AppContext);
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const categories = [
    { id: "all", name: "All Categories", icon: Target },
    { id: "security", name: "Security", icon: Shield },
    { id: "jailbreak", name: "Jailbreak", icon: Code2 },
    { id: "defi", name: "DeFi", icon: Zap },
    { id: "gaming", name: "Gaming", icon: Gamepad2 },
  ];

  const difficulties = [
    { id: "all", name: "All Levels" },
    { id: "Beginner", name: "Beginner" },
    { id: "Intermediate", name: "Intermediate" },
    { id: "Advanced", name: "Advanced" },
  ];

  const filteredChallenges = mockChallenges.filter(challenge => {
    const categoryMatch = selectedCategory === "all" || challenge.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === "all" || challenge.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "security": return Shield;
      case "jailbreak": return Code2;
      case "defi": return Zap;
      case "gaming": return Gamepad2;
      default: return Target;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "text-green-400 border-green-400/30 bg-green-400/10";
      case "Intermediate": return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
      case "Advanced": return "text-red-400 border-red-400/30 bg-red-400/10";
      default: return "text-white/60 border-white/20 bg-white/10";
    }
  };

  const handleChallengeClick = (challenge: Challenge) => {
    if (challenge.isLocked) {
      return; // Don't navigate to locked challenges
    }
    router.push(`/challenge/${challenge.id}`);
  };

  return (
    <main className={cn("relative w-full min-h-screen bg-black", inter.className)}>
      {/* Minimalistic Tech Background */}
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
              Practice Challenges
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Sharpen your skills with hands-on challenges. Learn by doing, earn VIVON tokens, and collect NFT achievements.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">24</div>
                  <div className="text-sm text-white/60">Total Challenges</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">3</div>
                  <div className="text-sm text-white/60">Completed</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">750</div>
                  <div className="text-sm text-white/60">VIVON Earned</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-sm text-white/60">Rank</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            {/* Categories */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200",
                        selectedCategory === category.id
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="lg:w-64">
              <h3 className="text-lg font-semibold text-white mb-4">Difficulty</h3>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id} className="bg-gray-800">
                    {difficulty.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredChallenges.map((challenge) => {
              const CategoryIcon = getCategoryIcon(challenge.category);
              return (
                <div
                  key={challenge.id}
                  className={cn(
                    "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-200 group",
                    challenge.isLocked 
                      ? "opacity-60 cursor-not-allowed" 
                      : "cursor-pointer hover:bg-white/10 hover:border-white/20",
                    challenge.featured && "ring-2 ring-blue-500/30"
                  )}
                  onClick={() => handleChallengeClick(challenge)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        {challenge.isLocked ? (
                          <Lock className="w-5 h-5 text-white/40" />
                        ) : challenge.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <CategoryIcon className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {challenge.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Clock className="w-4 h-4" />
                          {challenge.duration}
                        </div>
                      </div>
                    </div>
                    {challenge.featured && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                        <Star className="w-3 h-3" />
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {challenge.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {challenge.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/5 text-white/60 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-bold text-green-400">
                        {challenge.reward} VIVON
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border",
                      getDifficultyColor(challenge.difficulty)
                    )}>
                      {challenge.difficulty}
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1 text-sm text-white/60">
                      <Users className="w-4 h-4" />
                      {challenge.participants} participants
                    </div>
                    {challenge.isLocked ? (
                      <div className="text-white/40 text-sm">Locked</div>
                    ) : challenge.isCompleted ? (
                      <div className="flex items-center gap-1 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-blue-400 text-sm">
                        <Play className="w-4 h-4" />
                        Start
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Learn Section */}
          <div id="learn" className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6">
                Learn & Earn
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Master new skills through our structured learning paths and earn VIVON tokens along the way.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Learning Paths</h3>
                    <p className="text-white/60">Structured courses for progressive learning</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">AI Safety Basics</div>
                      <div className="text-sm text-white/60">5 lessons • 2 hours</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Advanced Security</div>
                      <div className="text-sm text-white/60">8 lessons • 4 hours</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40" />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">NFT Rewards</h3>
                    <p className="text-white/60">Collect exclusive NFTs for achievements</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Security Expert Badge</div>
                      <div className="text-sm text-white/60">Complete 10 security challenges</div>
                    </div>
                    <div className="text-purple-400 text-sm">50% Complete</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Jailbreak Master</div>
                      <div className="text-sm text-white/60">Win 5 jailbreak bounties</div>
                    </div>
                    <div className="text-purple-400 text-sm">20% Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
} 