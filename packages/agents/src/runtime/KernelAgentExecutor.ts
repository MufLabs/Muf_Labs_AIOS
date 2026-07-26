import { IAgentExecutor } from "./IAgentExecutor";
import { ExecutionContext } from "./ExecutionContext";
import { ExecutionResult } from "./ExecutionResults";

export class KernelAgentExecutor implements IAgentExecutor {

    public async execute(

        execution: ExecutionContext

    ): Promise<ExecutionResult> {

        throw new Error(

            "KernelAgentExecutor is not connected to @muf/kernel yet."

        );

    }

}