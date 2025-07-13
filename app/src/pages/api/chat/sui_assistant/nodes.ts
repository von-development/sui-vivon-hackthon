import { END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { GraphStateType } from "./state";
import { PROMPTS } from "./prompts";
import type { SuiBlockchainRetriever } from "./retriever";

/**
 * Decision functions for the Sui blockchain assistant workflow
 */

export function shouldRetrieve(state: GraphStateType): string {
    const { messages } = state;
    console.log("---DECIDE TO RETRIEVE SUI DOCS---");
    const lastMessage = messages[messages.length - 1];

    if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length) {
        console.log("---DECISION: RETRIEVE SUI DOCUMENTATION---");
        return "retrieve";
    }
    return END;
}

export function checkRelevance(state: GraphStateType): string {
    console.log("---CHECK SUI DOCUMENTATION RELEVANCE---");
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];

    if (!("tool_calls" in lastMessage)) {
        throw new Error("The 'checkRelevance' node requires the most recent message to contain tool calls.")
    }
    const toolCalls = (lastMessage as AIMessage).tool_calls;
    if (!toolCalls || !toolCalls.length) {
        throw new Error("Last message was not a function message");
    }

    if (toolCalls[0].args.binaryScore === "yes") {
        console.log("---DECISION: SUI DOCS RELEVANT---");
        return "yes";
    }
    console.log("---DECISION: SUI DOCS NOT RELEVANT---");
    return "no";
}

/**
 * Processing nodes for the Sui blockchain assistant workflow
 */

export function createSuiAgentNode(retriever: SuiBlockchainRetriever) {
    return async function suiAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
        console.log("---CALL SUI BLOCKCHAIN AGENT---");
        const { messages } = state;

        // Filter out relevance scoring messages to keep conversation clean
        const filteredMessages = messages.filter((message) => {
            if ("tool_calls" in message && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
                return message.tool_calls[0].name !== "give_relevance_score";
            }
            return true;
        });

        // Add system message with Sui blockchain context
        const messagesWithSystem = [
            new SystemMessage(PROMPTS.AGENT_SYSTEM_TEMPLATE),
            ...filteredMessages
        ];

        // Use GPT-4 for better code understanding and generation
        const model = new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0.1, // Lower temperature for more precise technical responses
            streaming: true,
        }).bindTools(retriever.tools);

        const response = await model.invoke(messagesWithSystem);
        return {
            messages: [response],
        };
    };
}

export async function gradeDocuments(state: GraphStateType): Promise<Partial<GraphStateType>> {
    console.log("---EVALUATE SUI DOCUMENTATION RELEVANCE---");
    const { messages } = state;

    const tool = {
        name: "give_relevance_score",
        description: "Give a relevance score to the retrieved Sui blockchain documentation.",
        schema: z.object({
            binaryScore: z.enum(["yes", "no"]).describe("Relevance score 'yes' or 'no' for Sui blockchain content"),
        })
    };

    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
    }).bindTools([tool], {
        tool_choice: tool.name,
    });

    const chain = PROMPTS.RELEVANCE_PROMPT.pipe(model);
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
        throw new Error("No content found in the last message");
    }

    const score = await chain.invoke({
        question: messages[0].content as string,
        context: lastMessage.content as string,
    });

    return {
        messages: [score]
    };
}

export async function rewriteQuery(state: GraphStateType): Promise<Partial<GraphStateType>> {
    console.log("---REWRITE SUI BLOCKCHAIN QUERY---");
    const { messages } = state;
    const question = messages[0].content as string;

    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.2, // Slightly higher for creative query rewriting
        streaming: true,
    });

    const response = await PROMPTS.REWRITE_PROMPT.pipe(model).invoke({ question });
    return {
        messages: [response],
    };
}

export async function generateResponse(state: GraphStateType): Promise<Partial<GraphStateType>> {
    console.log("---GENERATE SUI BLOCKCHAIN RESPONSE---");
    const { messages } = state;
    const question = messages[0].content as string;

    // Find the most recent tool message containing documentation
    const lastToolMessage = messages.slice().reverse().find((msg) => msg._getType() === "tool");
    if (!lastToolMessage) {
        throw new Error("No tool message found in the conversation history");
    }

    const docs = lastToolMessage.content as string;
    
    // Use higher temperature for more natural response generation
    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.3,
        streaming: true,
    });

    const response = await PROMPTS.GENERATE_PROMPT.pipe(llm).invoke({
        context: docs,
        question,
    });

    return {
        messages: [response],
    };
}

/**
 * Helper function to create a simple response node for error handling
 */
export async function createErrorResponse(errorMessage: string): Promise<Partial<GraphStateType>> {
    const errorResponse = new AIMessage({
        content: `I apologize, but I encountered an error while processing your request: ${errorMessage}. Please try rephrasing your question or ask about a different Sui blockchain topic. I'm here to help with Sui development, Move programming, and VIVON platform features!`
    });

    return {
        messages: [errorResponse],
    };
} 