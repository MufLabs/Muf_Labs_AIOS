import { IAgentExecutor } from "./IAgentExecutor.js";
import { ExecutionContext } from "./ExecutionContext.js";
import { ExecutionResult } from "./ExecutionResults.js";

export class KernelAgentExecutor implements IAgentExecutor {

    public async execute(

        execution: ExecutionContext

    ): Promise<ExecutionResult> {

        throw new Error(

            "KernelAgentExecutor is not connected to @muf/kernel yet."

        );

    }

}
