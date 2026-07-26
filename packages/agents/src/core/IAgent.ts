import { AgentDefinition } from "./AgentDefinition";
import { AgentContext } from "./AgentContext";
import { AgentResult } from "./AgentResult";

/**
 * Runtime contract implemented by every executable agent.
 *
 * AgentDefinition describes an agent.
 * IAgent executes an agent.
 */
export interface IAgent {
    /**
     * Immutable agent definition loaded from the markdown source.
     */
    readonly definition: AgentDefinition;

    /**
     * Convenience identifier.
     */
    readonly id: string;

    /**
     * Human readable name.
     */
    readonly name: string;

    /**
     * Indicates whether the agent can currently execute.
     */
    readonly enabled: boolean;

    /**
     * Executes the agent.
     */
    execute(
        context: AgentContext,
        input: string
    ): Promise<AgentResult>;

    /**
     * Determines whether this agent can execute the requested capability.
     */
    supports(capability: string): boolean;

    /**
     * Performs any initialization required by the runtime.
     */
    initialize?(): Promise<void>;

    /**
     * Releases runtime resources.
     */
    dispose?(): Promise<void>;
}