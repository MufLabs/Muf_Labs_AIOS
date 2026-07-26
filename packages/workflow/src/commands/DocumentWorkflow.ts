import { KernelContext } from "@aios/kernel";

import { IWorkflow } from "../interfaces/IWorkflow";

import {
    WorkflowRequest,
    WorkflowResult
} from "../types/WorkflowTypes";

export class DocumentWorkflow implements IWorkflow {

    async execute(

        context: KernelContext,

        request: WorkflowRequest

    ): Promise<WorkflowResult> {

        context.workflow.active =
            "Document";

        context.workflow.startedAt =
            new Date();

        delete context.workflow.completedAt;

        context.events.emit(
            "workflow.document.started",
            request
        );

        return {

            success: true,

            output: request.prompt

        };

    }

}