import { AgentContext } from "../core";
import { AgentRequest } from "../types";
import { RuntimeResult } from "../runtime";

export interface IAgentManager {

    initialize(): Promise<void>;

    execute(

        context: AgentContext,

        request: AgentRequest

    ): Promise<RuntimeResult>;

}