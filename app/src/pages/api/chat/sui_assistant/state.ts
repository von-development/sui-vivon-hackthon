import { BaseMessage } from "@langchain/core/messages";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

/**
 * State interface for the Sui blockchain assistant workflow
 */
export interface GraphStateType {
    messages: BaseMessage[];
}

/**
 * Graph state annotation for LangGraph
 */
export const GraphState = MessagesAnnotation;

/**
 * Type alias for better type safety
 */
export type State = typeof GraphState.State;