import { AgentDefinition } from "../core/AgentDefinition.js";

export interface IAgentLoader {

    load(): Promise<AgentDefinition[]>;

}
