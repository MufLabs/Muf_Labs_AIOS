import { AgentRegistry } from "./AgentRegistry";
import { RegistryStatistics } from "./RegistryStatistics";

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