import { KernelContext } from "@aios/kernel";

export type WorkflowCommand =
    | "Analyze"
    | "Implement"
    | "Document";

export interface WorkflowRequest {

    command: WorkflowCommand;

    prompt: string;

}

export interface WorkflowResult {

    success: boolean;

    output: string;

}

export interface WorkflowHandler {

    execute(
        context: KernelContext,
        request: WorkflowRequest
    ): Promise<WorkflowResult>;

}