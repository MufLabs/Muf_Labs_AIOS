import { AgentContext } from "../core/AgentContext";
import { AgentRequest } from "../types";
import { RuntimeResult } from "./RuntimeResults";

export interface IAgentRuntime {

    execute(

        context: AgentContext,

        request: AgentRequest

    ): Promise<RuntimeResult>;

}