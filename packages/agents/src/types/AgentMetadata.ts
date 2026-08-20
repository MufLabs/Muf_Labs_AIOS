import type { AgentCapability } from "./AgentCapability.js";

export interface AgentMetadata {

    id: string;

    name: string;

    description: string;

    version?: string;

    author?: string;

    capabilities: AgentCapability[];

}
