import { NextApiRequest, NextApiResponse } from "next";
import { AIMessage, BaseMessage, ChatMessage as LangChainChatMessage, HumanMessage } from "@langchain/core/messages";

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
 * Development fallback response generator
 */
function generateDevelopmentResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('sui') || message.includes('blockchain')) {
        return `I'm here to help with Sui blockchain development! 

**About Sui Blockchain:**
- Sui is a layer-1 blockchain designed for high-performance and low-latency applications
- It uses the Move programming language for smart contracts
- Features object-centric architecture with parallel execution

**Common Sui Development Topics:**
- Smart contract development with Move
- Object ownership and transfers
- Sui CLI and development tools
- DeFi protocols and NFTs
- VIVON platform integration

**Note:** This is a development fallback response. To enable full AI capabilities, please configure:
- OpenAI API key for language processing
- Supabase for document retrieval
- Environment variables in \`.env.local\`

How can I help you with Sui blockchain development today?`;
    }
    
    if (message.includes('move') || message.includes('smart contract')) {
        return `**Move Programming Language on Sui:**

Move is a resource-oriented programming language designed for blockchain development:

\`\`\`move
module hello_world::hello {
    use std::string;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    struct HelloWorld has key, store {
        id: UID,
        text: string::String
    }

    public fun mint(ctx: &mut TxContext) {
        let object = HelloWorld {
            id: object::new(ctx),
            text: string::utf8(b"Hello World!")
        };
        transfer::public_transfer(object, tx_context::sender(ctx));
    }
}
\`\`\`

**Key Move Concepts:**
- Resources and ownership
- Abilities (copy, drop, store, key)
- Object-centric programming
- Safe resource management

Need help with specific Move concepts or VIVON platform features?`;
    }
    
    if (message.includes('vivon') || message.includes('bounty') || message.includes('challenge')) {
        return `**VIVON Platform Features:**

VIVON is a Web3 bounty and challenge platform built on Sui:

**Core Features:**
- **Bounties:** Create and participate in development bounties
- **Challenges:** Technical challenges with rewards
- **VIVON Tokens:** Platform native tokens for rewards
- **NFTs:** Achievement and reward NFTs
- **Smart Contracts:** Automated reward distribution

**Platform Integration:**
- Sui wallet integration
- Smart contract templates
- Developer tools and SDKs
- Community governance

**Getting Started:**
1. Connect your Sui wallet
2. Browse available bounties
3. Submit solutions
4. Earn VIVON tokens and NFTs

Would you like to know more about any specific VIVON feature?`;
    }
    
    return `Hello! I'm the Sui Blockchain Assistant for the VIVON platform.

**I can help you with:**
- Sui blockchain development
- Move programming language
- Smart contract creation
- VIVON platform features
- DeFi protocols and NFTs
- Development best practices

**Current Status:** Development mode (limited functionality)
To enable full AI capabilities, configure API keys in your environment.

What would you like to know about Sui blockchain or VIVON platform?`;
}

/**
 * API handler for the Sui blockchain assistant
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        // Health check
        res.status(200).json({
            status: "healthy",
            service: "sui_blockchain_assistant",
            mode: "development",
            timestamp: new Date().toISOString()
        });
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const body = req.body;
        const returnIntermediateSteps = body.show_intermediate_steps || false;
        
        // Debug: Log all environment variables starting with relevant prefixes
        console.log("Available environment variables:", {
            node_env: process.env.NODE_ENV,
            supabase_vars: Object.keys(process.env).filter(key => key.startsWith('SUPABASE')),
            openai_vars: Object.keys(process.env).filter(key => key.startsWith('OPENAI')),
            nextjs_vars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC'))
        });

        // Validate messages
        const messages = (body.messages ?? [])
            .filter((message: SuiChatMessage) =>
                message.role === "user" || message.role === "assistant"
            );

        if (messages.length === 0) {
            res.status(400).json({ error: "No valid messages provided" });
            return;
        }

        const lastUserMessage = messages.filter((m: SuiChatMessage) => m.role === "user").pop();
        if (!lastUserMessage) {
            res.status(400).json({ error: "No user message found" });
            return;
        }

        // Check if we have the required environment variables
        const openaiKey = process.env.OPENAI_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PRIVATE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        console.log("Environment check:", {
            hasOpenAI: !!openaiKey,
            hasSupabaseUrl: !!supabaseUrl,
            hasSupabaseKey: !!supabaseKey,
            supabaseKeyType: process.env.SUPABASE_PRIVATE_KEY ? 'PRIVATE_KEY' : 
                           process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 
                           process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'NONE'
        });

        const hasApiKeys = openaiKey && supabaseUrl && supabaseKey;

        if (!hasApiKeys) {
            console.log("Missing API keys, using development fallback");
            // Development fallback
            const responseContent = generateDevelopmentResponse(lastUserMessage.content);
            
            if (!returnIntermediateSteps) {
                // Stream the response
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                // Simulate streaming by sending chunks
                const chunks = responseContent.split(' ');
                for (let i = 0; i < chunks.length; i++) {
                    res.write(chunks[i] + (i < chunks.length - 1 ? ' ' : ''));
                    // Small delay to simulate streaming
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
                res.end();
            } else {
                // Return complete response
                res.status(200).json({
                    messages: [
                        { role: "assistant", content: responseContent }
                    ],
                    metadata: {
                        messageCount: 1,
                        hasToolCalls: false,
                        mode: "development_fallback"
                    }
                });
            }
            return;
        }

        // If we have API keys, use the full implementation
        console.log("Using full AI implementation with API keys");
        const { createSuiBlockchainRetriever } = await import("./sui_assistant/retriever");
        const { createWorkflow, WORKFLOW_CONFIG } = await import("./sui_assistant/graph");

        const retriever = createSuiBlockchainRetriever();
        const app = createWorkflow(retriever);

        const langChainMessages = messages.map(convertChatMessageToLangChainMessage);

        if (!returnIntermediateSteps) {
            // Stream the response for real-time interaction
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const eventStream = await app.streamEvents(
                { messages: langChainMessages },
                { 
                    version: "v2",
                    configurable: {
                        recursionLimit: WORKFLOW_CONFIG.recursionLimit,
                    }
                }
            );

            try {
                for await (const chunk of eventStream) {
                    // Stream chat model responses
                    if (chunk.event === "on_chat_model_stream") {
                        if (chunk.data.chunk.content) {
                            res.write(chunk.data.chunk.content);
                        }
                    }
                    
                    // Optional: Stream intermediate steps for debugging
                    if (WORKFLOW_CONFIG.debug && chunk.event === "on_chain_start") {
                        console.log("Chain started:", chunk.name);
                    }
                }
                res.end();
            } catch (streamError) {
                console.error("Streaming error:", streamError);
                res.status(500).json({ error: "Streaming error occurred" });
            }
        } else {
            // Return complete response with intermediate steps for debugging
            const result = await app.invoke(
                { messages: langChainMessages },
                {
                    configurable: {
                        recursionLimit: WORKFLOW_CONFIG.recursionLimit,
                    }
                }
            );

            res.status(200).json({
                messages: result.messages.map(convertLangChainMessageToChatMessage),
                metadata: {
                    messageCount: result.messages.length,
                    hasToolCalls: result.messages.some((msg: any) => msg.tool_calls?.length > 0),
                }
            });
        }
    } catch (error: any) {
        console.error("Error in Sui blockchain assistant:", error);
        
        // Return appropriate error response
        const errorMessage = error.message || "An unexpected error occurred";
        const statusCode = error.status || 500;
        
        res.status(statusCode).json({
            error: errorMessage,
            type: "sui_assistant_error",
            details: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
} 