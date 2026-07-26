import type { AgentCapability } from "./AgentCapability";

export interface AgentMetadata {

    id: string;

    name: string;

    description: string;

    version?: string;

    author?: string;

    capabilities: AgentCapability[];

}