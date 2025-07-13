import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/router";
import { 
  Bot,
  Lock,
  MessageSquare,
  Code,
  BookOpen,
  Palette,
  Shield,
  Coins,
  ArrowRight
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

interface AIHelper {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  isLocked: boolean;
  speciality: string;
}



const aiHelpers: AIHelper[] = [
  {
    id: "sui-blockchain",
    name: "Sui Blockchain Assistant",
    description: "Expert in Sui blockchain development, smart contracts, and Move programming language",
    icon: Coins,
    color: "from-blue-500 to-cyan-500",
    isLocked: false,
    speciality: "Blockchain Development"
  },
  {
    id: "smart-contract",
    name: "Smart Contract Auditor",
    description: "Specialized in auditing and security analysis of smart contracts",
    icon: Shield,
    color: "from-green-500 to-emerald-500",
    isLocked: true,
    speciality: "Security & Auditing"
  },
  {
    id: "move-expert",
    name: "Move Language Expert",
    description: "Deep expertise in Move programming language and best practices",
    icon: Code,
    color: "from-purple-500 to-pink-500",
    isLocked: true,
    speciality: "Move Programming"
  },
  {
    id: "dapp-architect",
    name: "dApp Architecture Guide",
    description: "Helps design scalable and efficient decentralized applications",
    icon: Bot,
    color: "from-orange-500 to-red-500",
    isLocked: true,
    speciality: "dApp Architecture"
  },
  {
    id: "ui-designer",
    name: "Web3 UI Designer",
    description: "Specializes in creating intuitive user interfaces for Web3 applications",
    icon: Palette,
    color: "from-indigo-500 to-purple-500",
    isLocked: true,
    speciality: "UI/UX Design"
  },
  {
    id: "documentation",
    name: "Documentation Helper",
    description: "Assists in creating comprehensive technical documentation",
    icon: BookOpen,
    color: "from-yellow-500 to-orange-500",
    isLocked: true,
    speciality: "Documentation"
  }
];

export default function AIHelpers() {
  const { walletAddress } = useContext(AppContext);
  const router = useRouter();

  const handleHelperClick = (helper: AIHelper) => {
    if (helper.isLocked) {
      return;
    }
    // Navigate to individual chat page
    router.push(`/ai-helpers/${helper.id}`);
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

      <Navigation />

      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              AI Helpers
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Specialized AI assistants to help you with Sui blockchain development, smart contracts, and Web3 applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiHelpers.map((helper) => (
              <div
                key={helper.id}
                onClick={() => handleHelperClick(helper)}
                className={cn(
                  "relative p-6 rounded-2xl border border-white/10 transition-all duration-300 group",
                  helper.isLocked 
                    ? "bg-white/5 cursor-not-allowed opacity-60" 
                    : "bg-white/5 hover:bg-white/10 cursor-pointer hover:border-white/20 hover:scale-[1.02]"
                )}
              >
                {helper.isLocked && (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-5 h-5 text-white/50" />
                  </div>
                )}

                {!helper.isLocked && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-white/70" />
                  </div>
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-r",
                  helper.color
                )}>
                  <helper.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">
                  {helper.name}
                </h3>
                
                <p className="text-white/70 text-sm mb-4">
                  {helper.description}
                </p>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white/50 px-2 py-1 bg-white/10 rounded-full">
                    {helper.speciality}
                  </span>
                  {helper.isLocked && (
                    <span className="text-xs font-medium text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded-full">
                      Not Available Yet
                    </span>
                  )}
                </div>

                {!helper.isLocked && (
                  <div className="mt-4 flex items-center text-blue-400 text-sm font-medium">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Click to chat
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 