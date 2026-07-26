import { ExecutionContext } from "./ExecutionContext";
import { ExecutionResult } from "./ExecutionResults";

export interface IAgentExecutor {

    execute(

        execution: ExecutionContext

    ): Promise<ExecutionResult>;

}