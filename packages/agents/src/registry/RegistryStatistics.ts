import { AgentDefinition } from "../core/AgentDefinition.js";

export interface RegistryStatistics {

    totalAgents: number;

    capabilities: string[];

    agentIds: string[];

    agents: AgentDefinition[];

}
