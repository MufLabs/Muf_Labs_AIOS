import { AgentDefinition } from "../core/AgentDefinition";

export interface IAgentLoader {

    load(): Promise<AgentDefinition[]>;

}