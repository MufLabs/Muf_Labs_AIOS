import { IAgent } from "../core/IAgent";
import { IAgentRegistry } from "./IAgentRegistry";

/**
 * Central runtime registry.
 *
 * Stores executable agents, not markdown definitions.
 */
export class AgentRegistry implements IAgentRegistry {

    private readonly agents = new Map<string, IAgent>();

    /**
     * Registers an executable agent.
     */
    public register(agent: IAgent): void {

        this.agents.set(agent.id, agent);

    }

    /**
     * Registers multiple agents.
     */
    public registerMany(agents: readonly IAgent[]): void {

        for (const agent of agents) {

            this.register(agent);

        }

    }

    /**
     * Removes an agent.
     */
    public unregister(id: string): boolean {

        return this.agents.delete(id);

    }

    /**
     * Returns an agent by id.
     */
    public get(id: string): IAgent | undefined {

        return this.agents.get(id);

    }

    /**
     * Returns every registered agent.
     */
    public getAll(): IAgent[] {

        return [...this.agents.values()];

    }

    /**
     * Indicates whether an agent exists.
     */
    public exists(id: string): boolean {

        return this.agents.has(id);

    }

    /**
     * Finds an agent by name.
     */
    public findByName(name: string): IAgent | undefined {

        const normalized = name.trim().toLowerCase();

        return this.getAll().find(
            agent => agent.name.toLowerCase() === normalized
        );

    }

    /**
     * Returns all agents supporting a capability.
     */
    public findByCapability(capability: string): IAgent[] {

        return this.getAll().filter(
            agent => agent.supports(capability)
        );

    }

    /**
     * Removes every registered agent.
     */
    public clear(): void {

        this.agents.clear();

    }

    /**
     * Number of registered agents.
     */
    public get size(): number {

        return this.agents.size;

    }

}