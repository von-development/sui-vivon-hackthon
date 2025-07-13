import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/router";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { 
  Bot,
  Code,
  BookOpen,
  Palette,
  Shield,
  Coins,
  ArrowLeft
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

interface AIHelper {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  speciality: string;
}

const aiHelpers: { [key: string]: AIHelper } = {
  "sui-blockchain": {
    id: "sui-blockchain",
    name: "Sui Blockchain Assistant",
    description: "Expert in Sui blockchain development, smart contracts, and Move programming language",
    icon: Coins,
    color: "from-blue-500 to-cyan-500",
    speciality: "Blockchain Development"
  },
  "smart-contract": {
    id: "smart-contract",
    name: "Smart Contract Auditor",
    description: "Specialized in auditing and security analysis of smart contracts",
    icon: Shield,
    color: "from-green-500 to-emerald-500",
    speciality: "Security & Auditing"
  },
  "move-expert": {
    id: "move-expert",
    name: "Move Language Expert",
    description: "Deep expertise in Move programming language and best practices",
    icon: Code,
    color: "from-purple-500 to-pink-500",
    speciality: "Move Programming"
  },
  "dapp-architect": {
    id: "dapp-architect",
    name: "dApp Architecture Guide",
    description: "Helps design scalable and efficient decentralized applications",
    icon: Bot,
    color: "from-orange-500 to-red-500",
    speciality: "dApp Architecture"
  },
  "ui-designer": {
    id: "ui-designer",
    name: "Web3 UI Designer",
    description: "Specializes in creating intuitive user interfaces for Web3 applications",
    icon: Palette,
    color: "from-indigo-500 to-purple-500",
    speciality: "UI/UX Design"
  },
  "documentation": {
    id: "documentation",
    name: "Documentation Helper",
    description: "Assists in creating comprehensive technical documentation",
    icon: BookOpen,
    color: "from-yellow-500 to-orange-500",
    speciality: "Documentation"
  }
};

export default function AIHelperChat() {
  const { walletAddress } = useContext(AppContext);
  const router = useRouter();
  const { id } = router.query;

  const helper = id ? aiHelpers[id as string] : null;

  if (!helper) {
    return (
      <main className={cn("relative w-full min-h-screen bg-black flex items-center justify-center", inter.className)}>
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">AI Helper Not Found</h1>
          <button
            onClick={() => router.push("/ai-helpers")}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Go back to AI Helpers
          </button>
        </div>
      </main>
    );
  }

  // Only Sui Blockchain Assistant is available
  if (helper.id !== "sui-blockchain") {
    return (
      <main className={cn("relative w-full min-h-screen bg-black flex items-center justify-center", inter.className)}>
        <div className="text-center">
          <div className={cn(
            "w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-gradient-to-r",
            helper.color
          )}>
            <helper.icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-4">{helper.name}</h1>
          <p className="text-white/70 text-lg mb-6 max-w-md mx-auto">
            This AI assistant is not available yet. We're working hard to bring you more specialized helpers.
          </p>
          <div className="space-y-3">
            <div className="text-yellow-400 text-sm font-medium px-3 py-1 bg-yellow-400/10 rounded-full inline-block">
              Coming Soon
            </div>
            <div>
              <button
                onClick={() => router.push("/ai-helpers")}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                ← Go back to AI Helpers
              </button>
            </div>
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

      <div className="relative z-10 pt-24 pb-8">
        <div className="max-w-5xl mx-auto px-6 h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/ai-helpers")}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to AI Helpers
            </button>
          </div>

          {/* Chat Interface */}
          <div className="h-full">
            <ChatWindow
              endpoint="/api/chat/sui_assistant"
              agentIcon={<helper.icon className="w-5 h-5 text-white" />}
              helperColor={helper.color}
              helperName={helper.name}
              placeholder="Ask me anything about Sui blockchain development..."
              showIntermediateSteps={false}
            />
          </div>
        </div>
      </div>
    </main>
  );
} 