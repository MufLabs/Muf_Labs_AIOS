import { KernelContext } from "@aios/kernel";

import { IWorkflow } from "../interfaces/IWorkflow";

import {
    WorkflowRequest,
    WorkflowResult
} from "../types/WorkflowTypes";

export class ImplementWorkflow implements IWorkflow {

    async execute(

        context: KernelContext,

        request: WorkflowRequest

    ): Promise<WorkflowResult> {

        context.workflow.active =
            "Implement";

        context.workflow.startedAt =
            new Date();

        delete context.workflow.completedAt;

        context.events.emit(
            "workflow.implement.started",
            request
        );

        return {

            success: true,

            output: request.prompt

        };

    }

}