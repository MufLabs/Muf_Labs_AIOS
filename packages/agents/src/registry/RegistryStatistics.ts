import { AgentDefinition } from "../core/AgentDefinition";

export interface RegistryStatistics {

    totalAgents: number;

    capabilities: string[];

    agentIds: string[];

    agents: AgentDefinition[];

}