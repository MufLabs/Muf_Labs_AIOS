import { ExecutionContext } from "./ExecutionContext.js";
import { ExecutionResult } from "./ExecutionResults.js";

export interface IAgentExecutor {

    execute(

        execution: ExecutionContext

    ): Promise<ExecutionResult>;

}
