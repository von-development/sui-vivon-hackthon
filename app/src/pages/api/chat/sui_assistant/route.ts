import { NextRequest, NextResponse } from "next/server";
import { AIMessage, BaseMessage, ChatMessage as LangChainChatMessage, HumanMessage } from "@langchain/core/messages";
import { createSuiBlockchainRetriever } from "./retriever";
import { createWorkflow, WORKFLOW_CONFIG } from "./graph";

export const runtime = "edge";

/**
 * Custom message type for the chat interface
 */
interface SuiChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

/**
 * Converts a chat message to a LangChain message
 */
const convertChatMessageToLangChainMessage = (message: SuiChatMessage): BaseMessage => {
    if (message.role === "user") {
        return new HumanMessage(message.content);
    } else if (message.role === "assistant") {
        return new AIMessage(message.content);
    } else {
        return new LangChainChatMessage(message.content, message.role);
    }
};

/**
 * Converts LangChain message to chat message format
 */
const convertLangChainMessageToChatMessage = (message: BaseMessage): SuiChatMessage => {
    if (message._getType() === "human") {
        return { content: message.content as string, role: "user" };
    } else if (message._getType() === "ai") {
        return {
            content: message.content as string,
            role: "assistant",
        };
    } else {
        return { content: message.content as string, role: "assistant" };
    }
};

/**
 * Handles the chat request for the Sui blockchain assistant
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const returnIntermediateSteps = body.show_intermediate_steps || false;

        // Validate and convert messages
        const messages = (body.messages ?? [])
            .filter((message: SuiChatMessage) =>
                message.role === "user" || message.role === "assistant"
            )
            .map(convertChatMessageToLangChainMessage);

        if (messages.length === 0) {
            return NextResponse.json(
                { error: "No valid messages provided" },
                { status: 400 }
            );
        }

        // Initialize Sui blockchain retriever and create workflow
        const retriever = createSuiBlockchainRetriever();
        const app = createWorkflow(retriever);

        if (!returnIntermediateSteps) {
            // Stream the response for real-time interaction
            const eventStream = await app.streamEvents(
                { messages },
                { 
                    version: "v2",
                    configurable: {
                        recursionLimit: WORKFLOW_CONFIG.recursionLimit,
                    }
                }
            );

            const encoder = new TextEncoder();

            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of eventStream) {
                            // Stream chat model responses
                            if (chunk.event === "on_chat_model_stream") {
                                if (chunk.data.chunk.content) {
                                    const bytes = encoder.encode(chunk.data.chunk.content);
                                    controller.enqueue(bytes);
                                }
                            }
                            
                            // Optional: Stream intermediate steps for debugging
                            if (WORKFLOW_CONFIG.debug && chunk.event === "on_chain_start") {
                                console.log("Chain started:", chunk.name);
                            }
                        }
                        controller.close();
                    } catch (error) {
                        console.error("Streaming error:", error);
                        controller.error(error);
                    }
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } else {
            // Return complete response with intermediate steps for debugging
            const result = await app.invoke(
                { messages },
                {
                    configurable: {
                        recursionLimit: WORKFLOW_CONFIG.recursionLimit,
                    }
                }
            );

            return NextResponse.json(
                {
                    messages: result.messages.map(convertLangChainMessageToChatMessage),
                    metadata: {
                        messageCount: result.messages.length,
                        hasToolCalls: result.messages.some((msg: any) => msg.tool_calls?.length > 0),
                    }
                },
                { status: 200 }
            );
        }
    } catch (error: any) {
        console.error("Error in Sui blockchain assistant:", error);
        
        // Return appropriate error response
        const errorMessage = error.message || "An unexpected error occurred";
        const statusCode = error.status || 500;
        
        return NextResponse.json(
            { 
                error: errorMessage,
                type: "sui_assistant_error",
                details: WORKFLOW_CONFIG.debug ? error.stack : undefined
            },
            { status: statusCode }
        );
    }
}

/**
 * Handle GET requests for health check
 */
export async function GET() {
    return NextResponse.json(
        { 
            status: "healthy",
            service: "sui_blockchain_assistant",
            timestamp: new Date().toISOString()
        },
        { status: 200 }
    );
}
