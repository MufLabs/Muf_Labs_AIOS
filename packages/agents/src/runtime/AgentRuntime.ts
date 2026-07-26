import {
    AgentContext,
    AgentExecutionRuntime
} from "../core/AgentContext";
import { AgentDefinition } from "../core/AgentDefinition";
import { AgentResult } from "../core/AgentResult";
import { IAgent } from "../core/IAgent";

import { AgentRegistry } from "../registry/AgentRegistry";
import { AgentSelector } from "../registry/AgentSelector";

import { AgentRequest } from "../types";
import { RuntimeOptions } from "./RuntimeOptions";
import { RuntimeResult } from "./RuntimeResults";

/**
 * Central execution runtime.
 *
 * Executes already-instantiated runtime agents.
 */
export class AgentRuntime
    implements AgentExecutionRuntime {

    private readonly selector: AgentSelector;

    constructor(
        private readonly registry: AgentRegistry,
        private readonly options: RuntimeOptions = {}
    ) {

        this.selector = new AgentSelector(registry);

    }

    /**
     * Executes a workflow request.
     */
    public async execute(
        context: AgentContext,
        request: AgentRequest
    ): Promise<RuntimeResult>;

    /**
     * Executes a PromptAgent.
     */
    public async execute(
        definition: AgentDefinition,
        context: AgentContext,
        input: string
    ): Promise<AgentResult>;

    public async execute(
        arg1: AgentContext | AgentDefinition,
        arg2: AgentRequest | AgentContext,
        arg3?: string
    ): Promise<RuntimeResult | AgentResult> {

        /**
         * PromptAgent execution
         */
        if (typeof arg3 === "string") {

            return this.executeDefinition(
                arg1 as AgentDefinition,
                arg2 as AgentContext,
                arg3
            );

        }

        /**
         * Workflow execution
         */
        const context = arg1 as AgentContext;
        const request = arg2 as AgentRequest;

        const capability = request.command;

        const agents =
            this.selector.byCapability(capability);

        const results: AgentResult[] = [];
        const errors: Error[] = [];

        for (const agent of agents) {

            try {

                const result =
                    await agent.execute(
                        context,
                        request.prompt
                    );

                results.push(result);

            }
            catch (error) {

                errors.push(

                    error instanceof Error
                        ? error
                        : new Error(String(error))

                );

            }

        }

        return {

            success: errors.length === 0,

            results,

            errors: errors.map(
                error => error.message
            )

        };

    }

    /**
     * Executes a PromptAgent.
     */
    private async executeDefinition(
        definition: AgentDefinition,
        context: AgentContext,
        input: string
    ): Promise<AgentResult> {

        /**
         * Provider integration will be implemented in
         * the next Runtime block.
         */

        return {

            success: true,

            output: input,

            model: definition.model,

            provider: definition.provider,

            metadata: {

                agentId: definition.id,

                simulated: true,

                executionId: context.executionId

            }

        };

    }

    /**
     * Registers runtime agents.
     */
    public register(
        agent: IAgent
    ): void {

        this.registry.register(agent);

    }

    /**
     * Registers multiple runtime agents.
     */
    public registerMany(
        agents: readonly IAgent[]
    ): void {

        this.registry.registerMany(
            [...agents]
        );

    }

    /**
     * Returns every registered runtime agent.
     */
    public getAgents(): IAgent[] {

        return this.registry.getAll();

    }

}