import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { IntermediateStep } from "./IntermidateSteps";
import { Send, ArrowDown, Settings } from "lucide-react";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    id: string;
}

interface ChatWindowProps {
    endpoint: string;
    agentIcon?: React.ReactNode;
    helperColor?: string;
    helperName?: string;
    placeholder?: string;
    showIntermediateSteps?: boolean;
}

export function ChatWindow(props: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showIntermediateSteps, setShowIntermediateSteps] = useState(props.showIntermediateSteps || false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Welcome message
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMessage: ChatMessage = {
                id: 'welcome',
                role: 'assistant',
                content: `Hello! I'm the ${props.helperName || 'AI Assistant'}. I'm here to help you with Sui blockchain development, smart contracts, and VIVON platform features. How can I assist you today?`
            };
            setMessages([welcomeMessage]);
        }
    }, [props.helperName]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isAtBottom) {
            scrollToBottom();
        }
    }, [messages, isAtBottom]);

    // Handle scroll to check if user is at bottom
    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const threshold = 100;
            setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);

        try {
            const response = await fetch(props.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    show_intermediate_steps: showIntermediateSteps
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (showIntermediateSteps) {
                // Handle JSON response with intermediate steps
                const data = await response.json();
                if (data.messages) {
                    const newMessages = data.messages.map((msg: any, index: number) => ({
                        id: `${Date.now()}-${index}`,
                        role: msg.role,
                        content: msg.content
                    }));
                    setMessages(prev => [...prev, ...newMessages]);
                }
            } else {
                // Handle streaming response
                const reader = response.body?.getReader();
                if (reader) {
                    const assistantMessage: ChatMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: '',
                    };

                    setMessages(prev => [...prev, assistantMessage]);

                    const decoder = new TextDecoder();
                    let done = false;

                    while (!done) {
                        const { value, done: doneReading } = await reader.read();
                        done = doneReading;
                        const chunkValue = decoder.decode(value);

                        if (chunkValue) {
                            setMessages(prev => 
                                prev.map(msg => 
                                    msg.id === assistantMessage.id 
                                        ? { ...msg, content: msg.content + chunkValue }
                                        : msg
                                )
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r",
                        props.helperColor || "from-blue-500 to-cyan-500"
                    )}>
                        {props.agentIcon}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">
                            {props.helperName || 'AI Assistant'}
                        </h3>
                        <p className="text-white/60 text-sm">
                            Sui Blockchain Expert
                        </p>
                    </div>
                </div>

                {/* Intermediate Steps Toggle */}
                <button
                    onClick={() => setShowIntermediateSteps(!showIntermediateSteps)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-lg text-xs transition-colors",
                        showIntermediateSteps 
                            ? "bg-blue-500/20 text-blue-400" 
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                >
                    <Settings className="w-3 h-3" />
                    Debug Mode
                </button>
            </div>

            {/* Messages */}
            <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 space-y-4"
            >
                {messages.map((message) => {
                    if (message.role === 'system' && showIntermediateSteps) {
                        return <IntermediateStep key={message.id} message={message} />;
                    }
                    return (
                        <ChatMessageBubble
                            key={message.id}
                            message={message}
                            agentIcon={props.agentIcon}
                            helperColor={props.helperColor}
                        />
                    );
                })}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r",
                            props.helperColor || "from-blue-500 to-cyan-500"
                        )}>
                            {props.agentIcon}
                        </div>
                        <div className="bg-white/10 text-white/90 p-4 rounded-2xl">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {!isAtBottom && (
                <div className="absolute bottom-24 right-6">
                    <button
                        onClick={scrollToBottom}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors shadow-lg"
                    >
                        <ArrowDown className="w-4 h-4" />
                        Scroll to bottom
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="p-6 border-t border-white/10">
                <div className="flex gap-3">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={props.placeholder || "Ask me anything about Sui blockchain..."}
                        rows={3}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 resize-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl transition-colors flex items-center justify-center"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </div>
                <p className="text-xs text-white/40 mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}