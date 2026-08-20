import { AgentRegistry } from "./AgentRegistry.js";
import { RegistryStatistics } from "./RegistryStatistics.js";

export class RegistryInspector {

    constructor(

        private readonly registry: AgentRegistry

    ) { }

    public inspect(): RegistryStatistics {

        const agents =
            this.registry.getAll();

        return {

            totalAgents:
                agents.length,

            capabilities: [

                ...new Set(

                    agents.flatMap(

                        agent =>

                            agent.definition.capabilities.map(

                                (capability) => capability.name

                            )

                    )

                )

            ],

            agentIds:

                agents.map(

                    agent => agent.id

                ),

            agents:

                agents.map(

                    agent => agent.definition

                )

        };

    }

}
