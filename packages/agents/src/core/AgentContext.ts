import { AgentDefinition } from "./AgentDefinition";
import { AgentResult } from "./AgentResult";

/**
 * Runtime contract implemented by the execution engine.
 *
 * The concrete implementation will be provided by AgentRuntime
 * in the next block.
 */
export interface AgentExecutionRuntime {
    execute(
        definition: AgentDefinition,
        context: AgentContext,
        input: string
    ): Promise<AgentResult>;
}

/**
 * Execution context shared by every agent invocation.
 *
 * It contains the request state and the services required by
 * the runtime without coupling agents to concrete implementations.
 */
export interface AgentContext {
    /**
     * Unique execution identifier.
     */
    executionId: string;

    /**
     * Optional conversation identifier.
     */
    conversationId?: string;

    /**
     * Optional user identifier.
     */
    userId?: string;

    /**
     * Current workflow identifier.
     */
    workflowId?: string;

    /**
     * Variables shared during execution.
     */
    variables: Record<string, unknown>;

    /**
     * Shared execution memory.
     */
    memory: Record<string, unknown>;

    /**
     * Runtime services.
     */
    services?: Record<string, unknown>;

    /**
     * Runtime responsible for executing PromptAgents.
     */
    runtime?: AgentExecutionRuntime;

    /**
     * Cancellation signal.
     */
    abortSignal?: AbortSignal;

    /**
     * Timestamp when execution started.
     */
    startedAt: Date;

    /**
     * Additional metadata.
     */
    metadata?: Record<string, unknown>;
}