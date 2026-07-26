import {
    WorkflowRequest,
    WorkflowResult
} from "../types/WorkflowTypes";

import { KernelContext } from "@aios/kernel";

export interface IWorkflow {

    execute(
        context: KernelContext,
        request: WorkflowRequest
    ): Promise<WorkflowResult>;

}