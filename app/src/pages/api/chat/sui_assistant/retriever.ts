import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createRetrieverTool } from "langchain/tools/retriever";
import { ToolNode } from "@langchain/langgraph/prebuilt";

/**
 * Initializes connection to Supabase vector store for Sui documentation and creates retriever tools
 * @returns A configured retriever tool and tool node for Sui blockchain assistance
 */
export function createSuiBlockchainRetriever() {
    // Initialize Supabase client
    const client = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PRIVATE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Connect to vector store containing Sui documentation
    const vectorstore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
        client,
        tableName: "documents", // Standard LangChain table
        queryName: "match_documents", // Standard LangChain function
    });

    // Create retriever optimized for Sui blockchain documentation
    const retriever = vectorstore.asRetriever({
        searchType: "similarity",
        k: 6, // Retrieve more documents for comprehensive blockchain information
        // Add filters for better Sui-specific results if needed
        // filter: {
        //     document_type: 'sui_docs', 'move_reference', 'vivon_platform'
        // }
    });

    // Create retriever tool specific to Sui blockchain
    const tool = createRetrieverTool(retriever, {
        name: "search_sui_documentation",
        description: `Search comprehensive Sui blockchain documentation including:
        - Sui blockchain architecture and concepts
        - Move programming language reference
        - Smart contract development guides
        - VIVON platform features and APIs
        - Code examples and best practices
        - Token economics and DeFi protocols
        - NFT development on Sui
        - dApp development tutorials
        Use this tool to find technical information, code examples, and implementation guides.`,
    });

    // Create tool node for the graph workflow
    const toolNode = new ToolNode([tool]);

    return {
        tool,
        toolNode,
        tools: [tool], // Array of tools for the agent
        retriever, // Direct access to retriever if needed
    };
}

// Export types for better type safety
export type SuiBlockchainRetriever = ReturnType<typeof createSuiBlockchainRetriever>;

/**
 * Alternative retriever specifically for VIVON platform documentation
 * This can be used for platform-specific queries
 */
export function createVivonPlatformRetriever() {
    const client = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PRIVATE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const vectorstore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
        client,
        tableName: "documents", // Standard LangChain table
        queryName: "match_documents", // Standard LangChain function
    });

    const retriever = vectorstore.asRetriever({
        searchType: "similarity",
        k: 4,
    });

    const tool = createRetrieverTool(retriever, {
        name: "search_vivon_platform",
        description: `Search VIVON platform-specific documentation including:
        - Bounty creation and management
        - Challenge participation guides
        - VIVON token usage and economics
        - NFT minting and trading
        - Platform API documentation
        - User guides and tutorials
        Use this tool for platform-specific features and functionality.`,
    });

    const toolNode = new ToolNode([tool]);

    return {
        tool,
        toolNode,
        tools: [tool],
        retriever,
    };
} 