import { AgentContext } from "../core/AgentContext.js";
import { AgentRequest } from "../types";
import { RuntimeResult } from "./RuntimeResults.js";

export interface IAgentRuntime {

    execute(

        context: AgentContext,

        request: AgentRequest

    ): Promise<RuntimeResult>;

}
