import { AgentDefinition } from "./AgentDefinition";
import { AgentContext } from "./AgentContext";
import { AgentResult } from "./AgentResult";
import { IAgent } from "./IAgent";

/**
 * Base implementation for every executable agent.
 *
 * Concrete agents should inherit from this class.
 * The runtime is responsible for instantiating them.
 */
export abstract class Agent implements IAgent {

    public readonly definition: AgentDefinition;

    protected constructor(
        definition: AgentDefinition
    ) {

        this.definition = Object.freeze({
            ...definition
        });

    }

    /**
     * Agent identifier.
     */
    public get id(): string {

        return this.definition.id;

    }

    /**
     * Human readable name.
     */
    public get name(): string {

        return this.definition.name;

    }

    /**
     * Indicates whether the agent is enabled.
     */
    public get enabled(): boolean {

        return this.definition.enabled;

    }

    /**
     * Returns true if the agent supports
     * the requested capability.
     */
    public supports(
        capability: string
    ): boolean {

        return this.definition.capabilities.some(capabilityItem => {

            const capabilityName =
                typeof capabilityItem === "string"
                    ? capabilityItem
                    : capabilityItem.name;

            return (
                capabilityName.toLowerCase() ===
                capability.toLowerCase()
            );

        });

    }

    /**
     * Optional initialization hook.
     */
    public async initialize(): Promise<void> {

        // Default implementation intentionally left blank.

    }

    /**
     * Optional cleanup hook.
     */
    public async dispose(): Promise<void> {

        // Default implementation intentionally left blank.

    }

    /**
     * Executes the agent.
     *
     * Every concrete agent must implement
     * this method.
     */
    public abstract execute(
        context: AgentContext,
        input: string
    ): Promise<AgentResult>;

}