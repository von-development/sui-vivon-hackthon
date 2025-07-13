import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    id: string;
}

interface Source {
    pageContent: string;
    metadata?: {
        loc?: {
            lines: {
                from: number;
                to: number;
            };
        };
    };
}

function formatText(text: string) {
    return text
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-white/5 border border-white/10 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-2 py-1 rounded text-sm font-mono">$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-white/90">$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline transition-colors" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>')
        .replace(/^\d+\.\s+(.*$)/gm, '<div class="flex items-start mb-2"><span class="text-blue-400 font-semibold mr-2 mt-0.5">•</span><span>$1</span></div>')
        .replace(/^-\s+(.*$)/gm, '<div class="flex items-start mb-2"><span class="text-blue-400 mr-2 mt-0.5">•</span><span>$1</span></div>')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('<br />');
}

export function ChatMessageBubble(props: {
    message: ChatMessage;
    agentIcon?: React.ReactNode;
    sources?: Source[];
    helperColor?: string;
}) {
    const isUser = props.message.role === "user";
    const isSystem = props.message.role === "system";

    if (isSystem) {
        return null; // Handle system messages separately if needed
    }

    return (
        <div className={cn(
            "flex gap-4 mb-6",
            isUser ? "justify-end" : "justify-start"
        )}>
            {/* Assistant Avatar */}
            {!isUser && (
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r flex-shrink-0",
                    props.helperColor || "from-blue-500 to-cyan-500"
                )}>
                    {props.agentIcon || <Bot className="w-5 h-5 text-white" />}
                </div>
            )}

            {/* Message Content */}
            <div className={cn(
                "max-w-[80%] p-4 rounded-2xl",
                isUser 
                    ? "bg-blue-600 text-white" 
                    : "bg-white/10 text-white/90"
            )}>
                <div 
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                        __html: formatText(props.message.content)
                    }}
                />

                {/* Sources */}
                {!isUser && props.sources && props.sources.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                                Sources
                            </span>
                        </div>
                        <div className="space-y-2">
                            {props.sources.map((source, i) => (
                                <div 
                                    key={`source:${i}`} 
                                    className="text-xs bg-white/5 border border-white/10 p-3 rounded-lg"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-blue-400 mt-0.5">
                                            {i + 1}.
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-white/80 leading-relaxed">
                                                "{source.pageContent}"
                                            </p>
                                            {source.metadata?.loc?.lines && (
                                                <p className="text-white/50 mt-1">
                                                    Lines {source.metadata.loc.lines.from}-{source.metadata.loc.lines.to}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                </div>
            )}
        </div>
    );
}