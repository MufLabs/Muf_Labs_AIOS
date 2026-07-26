import { IAgent } from "../core/IAgent";
import { AgentRegistry } from "./AgentRegistry";

/**
 * Responsible for selecting the most appropriate runtime agent.
 *
 * This class never loads agents.
 * It only queries the AgentRegistry.
 */
export class AgentSelector {

    constructor(
        private readonly registry: AgentRegistry
    ) { }

    /**
     * Returns an agent by its identifier.
     */
    public byId(id: string): IAgent | undefined {

        return this.registry.get(id);

    }

    /**
     * Returns the first agent matching the supplied name.
     */
    public byName(name: string): IAgent | undefined {

        return this.registry.findByName(name);

    }

    /**
     * Returns every agent supporting the requested capability.
     */
    public byCapability(capability: string): IAgent[] {

        return this.registry.findByCapability(capability);

    }

    /**
     * Selects the highest priority agent supporting
     * the requested capability.
     */
    public select(capability: string): IAgent | undefined {

        const agents = this.byCapability(capability);

        if (agents.length === 0) {
            return undefined;
        }

        return agents.sort(
            (a, b) =>
                b.definition.priority - a.definition.priority
        )[0];

    }

    /**
     * Returns all registered agents.
     */
    public all(): IAgent[] {

        return this.registry.getAll();

    }

}