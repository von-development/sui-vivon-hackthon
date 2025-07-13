import { StateGraph, END } from "@langchain/langgraph";
import { GraphState } from "./state";
import { 
    shouldRetrieve, 
    checkRelevance, 
    createSuiAgentNode, 
    gradeDocuments, 
    rewriteQuery, 
    generateResponse 
} from "./nodes";
import type { SuiBlockchainRetriever } from "./retriever";

/**
 * Creates the Sui blockchain assistant workflow graph
 * @param retriever - The configured Sui blockchain retriever
 * @returns A compiled LangGraph workflow
 */
export function createSuiAssistantWorkflow(retriever: SuiBlockchainRetriever) {
    // Create the agent node with the retriever
    const agentNode = createSuiAgentNode(retriever);

    // Build the workflow graph
    const workflow = new StateGraph(GraphState)
        // Add nodes to the graph
        .addNode("agent", agentNode)
        .addNode("retrieve", retriever.toolNode)
        .addNode("grade_documents", gradeDocuments)
        .addNode("rewrite_query", rewriteQuery)
        .addNode("generate_response", generateResponse)
        
        // Define the workflow edges
        .addConditionalEdges("agent", shouldRetrieve)
        .addEdge("retrieve", "grade_documents")
        .addConditionalEdges(
            "grade_documents",
            checkRelevance,
            {
                yes: "generate_response",
                no: "rewrite_query"
            }
        )
        .addEdge("rewrite_query", "agent")
        .addEdge("generate_response", END)
        
        // Set entry point
        .setEntryPoint("agent");

    // Compile and return the workflow
    return workflow.compile();
}

/**
 * Alternative simplified workflow for direct responses
 * (useful for simple queries that don't need retrieval)
 */
export function createSimpleSuiAssistantWorkflow(retriever: SuiBlockchainRetriever) {
    const agentNode = createSuiAgentNode(retriever);

    const workflow = new StateGraph(GraphState)
        .addNode("agent", agentNode)
        .addNode("retrieve", retriever.toolNode)
        .addNode("generate_response", generateResponse)
        
        .addConditionalEdges("agent", shouldRetrieve)
        .addEdge("retrieve", "generate_response")
        .addEdge("generate_response", END)
        
        .setEntryPoint("agent");

    return workflow.compile();
}

/**
 * Workflow configuration options
 */
export const WORKFLOW_CONFIG = {
    // Maximum number of iterations to prevent infinite loops
    recursionLimit: 10,
    
    // Enable debug mode for development
    debug: process.env.NODE_ENV === "development",
    
    // Stream configuration
    streamMode: "values" as const,
} as const;

/**
 * Export the main workflow creation function
 */
export { createSuiAssistantWorkflow as createWorkflow };