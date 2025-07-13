import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    id: string;
}

export function IntermediateStep(props: { message: ChatMessage }) {
    const [expanded, setExpanded] = useState(false);
    
    let parsedInput;
    try {
        parsedInput = JSON.parse(props.message.content);
    } catch (error) {
        // If content is not JSON, treat it as a simple system message
        return (
            <div className="mb-4 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/70">
                <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">System</span>
                </div>
                <p>{props.message.content}</p>
            </div>
        );
    }

    const action = parsedInput.action;
    const observation = parsedInput.observation;

    return (
        <div className="mb-4 bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <button
                type="button"
                className="w-full p-3 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">
                        Step: <span className="font-mono text-blue-400">{action?.name || 'Unknown'}</span>
                    </span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-white/70" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-white/70" />
                )}
            </button>
            
            <div className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out",
                expanded ? "max-h-96" : "max-h-0"
            )}>
                <div className="p-3 pt-0 space-y-3 border-t border-white/10">
                    {action?.args && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-white/70 uppercase tracking-wide">
                                Input:
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded p-2 max-h-24 overflow-auto">
                                <code className="text-xs text-white/80 font-mono">
                                    {JSON.stringify(action.args, null, 2)}
                                </code>
                            </div>
                        </div>
                    )}
                    
                    {observation && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-white/70 uppercase tracking-wide">
                                Output:
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded p-2 max-h-48 overflow-auto">
                                <code className="text-xs text-white/80 font-mono whitespace-pre-wrap">
                                    {typeof observation === 'string' ? observation : JSON.stringify(observation, null, 2)}
                                </code>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}