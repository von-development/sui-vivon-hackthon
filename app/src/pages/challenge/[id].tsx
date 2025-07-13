import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import { useContext } from "react";
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
  ArrowLeft,
  Play,
  CheckCircle,
  Zap
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function ChallengeDetail() {
  const { walletAddress } = useContext(AppContext);
  const router = useRouter();
  const { id } = router.query;

  // Mock challenge data - in real app, fetch based on ID
  const challenge = {
    id: "1",
    title: "AI Safety Fundamentals",
    description: "Learn the basics of AI safety and alignment through interactive challenges. This comprehensive course covers the foundational concepts you need to understand AI safety.",
    category: "security",
    difficulty: "Beginner",
    duration: "30 min",
    participants: 1250,
    reward: 100,
    isLocked: false,
    isCompleted: false,
    featured: true,
    tags: ["AI Safety", "Fundamentals", "Introduction"],
    lessons: [
      { id: 1, title: "What is AI Safety?", duration: "5 min", completed: false },
      { id: 2, title: "Alignment Problem", duration: "8 min", completed: false },
      { id: 3, title: "Risk Assessment", duration: "7 min", completed: false },
      { id: 4, title: "Mitigation Strategies", duration: "10 min", completed: false },
    ]
  };

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

  const CategoryIcon = getCategoryIcon(challenge.category);

  if (!challenge) {
    return (
      <main className={cn("relative w-full min-h-screen bg-black", inter.className)}>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        </div>
        <Navigation />
        <div className="relative z-10 pt-24 px-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Target className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Challenge Not Found</h2>
            <p className="text-white/70 mb-6">This challenge doesn&apos;t exist or has been removed.</p>
            <ActionButton
              label="Back to Challenges"
              isConnected={true}
              isLoading={false}
              onClick={() => router.push("/challenges")}
              buttonClass="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
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

      <Navigation />

      <div className="relative z-10 pt-24 px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <button
            onClick={() => router.push("/challenges")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Challenges
          </button>

          {/* Challenge Header */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <CategoryIcon className="w-8 h-8 text-blue-400" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-white">{challenge.title}</h1>
                  {challenge.featured && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                      <Star className="w-4 h-4" />
                      Featured
                    </div>
                  )}
                </div>
                
                <p className="text-white/70 text-lg mb-6">{challenge.description}</p>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock className="w-4 h-4" />
                    <span>{challenge.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Users className="w-4 h-4" />
                    <span>{challenge.participants} participants</span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border",
                    getDifficultyColor(challenge.difficulty)
                  )}>
                    {challenge.difficulty}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <div className="text-2xl font-bold text-green-400">
                    {challenge.reward} VIVON
                  </div>
                  <div className="text-white/60">reward</div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {challenge.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white/5 text-white/60 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Course Content</h2>
            
            <div className="space-y-4">
              {challenge.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      {lesson.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <span className="text-blue-400 font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{lesson.title}</div>
                      <div className="text-sm text-white/60">{lesson.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lesson.completed ? (
                      <div className="text-green-400 text-sm">Completed</div>
                    ) : (
                      <Play className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <ActionButton
                label="Start Challenge"
                isConnected={!!walletAddress}
                isLoading={false}
                onClick={() => {}}
                buttonClass="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                contentClass="text-white"
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
} 