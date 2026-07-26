import { AgentContext } from "../core";
import { AgentDefinition } from "../core";

export interface ExecutionContext {

    /**
     * Global execution context.
     */
    context: AgentContext;

    /**
     * Agent being executed.
     */
    agent: AgentDefinition;

    /**
     * Final prompt sent to the LLM.
     */
    prompt: string;

    /**
     * Provider override.
     */
    provider?: string;

    /**
     * Model override.
     */
    model?: string;

    /**
     * Request timeout.
     */
    timeout?: number;

    /**
     * Additional provider-specific options.
     */
    options?: Record<string, unknown>;

}