import { Agent } from "./Agent";
import { AgentContext } from "./AgentContext";
import { AgentDefinition } from "./AgentDefinition";
import { AgentResult } from "./AgentResult";
import { IAgent } from "./IAgent";

/**
 * Default runtime implementation used for agents loaded
 * from Markdown (.agent.md) definitions.
 *
 * The runtime injects the actual LLM execution pipeline.
 */
class PromptAgent extends Agent {
    constructor(definition: AgentDefinition) {
        super(definition);
    }

    public async execute(
        context: AgentContext,
        input: string
    ): Promise<AgentResult> {

        const runtime = context.runtime;

        if (!runtime) {
            throw new Error(
                `No runtime available for agent '${this.name}'.`
            );
        }

        return runtime.execute(this.definition, context, input);
    }
}

/**
 * Factory responsible for converting an AgentDefinition
 * into an executable runtime agent.
 */
export class AgentFactory {

    /**
     * Creates a runtime agent from a definition.
     */
    public static create(
        definition: AgentDefinition
    ): IAgent {

        return new PromptAgent(definition);
    }

    /**
     * Creates multiple runtime agents.
     */
    public static createMany(
        definitions: readonly AgentDefinition[]
    ): IAgent[] {

        return definitions.map(
            definition => AgentFactory.create(definition)
        );
    }
}