import { KernelContext } from "@aios/kernel";

import { IWorkflow } from "../interfaces/IWorkflow.js";

import {
    WorkflowRequest,
    WorkflowResult
} from "../types/WorkflowTypes.js";

export class AnalyzeWorkflow implements IWorkflow {

    async execute(

        context: KernelContext,

        request: WorkflowRequest

    ): Promise<WorkflowResult> {

        context.workflow.active =
            "Analyze";

        context.workflow.startedAt =
            new Date();

        delete context.workflow.completedAt;

        context.events.emit(
            "workflow.analyze.started",
            request
        );

        return {

            success: true,

            output: request.prompt

        };

    }

}
