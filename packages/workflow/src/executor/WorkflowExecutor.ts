import { KernelContext } from "@aios/kernel";

import {
    WorkflowRequest,
    WorkflowResult
} from "../types/WorkflowTypes.js";

import { WorkflowRegistry } from "../registry/WorkflowRegistry.js";

export class WorkflowExecutor {

    constructor(

        private readonly registry: WorkflowRegistry

    ) { }

    async execute(

        context: KernelContext,

        request: WorkflowRequest

    ): Promise<WorkflowResult> {

        const workflow = this.registry.resolve(
            request.command
        );

        if (!workflow)

            throw new Error(
                `Workflow ${request.command} not found`
            );

        return workflow.execute(
            context,
            request
        );

    }

}
