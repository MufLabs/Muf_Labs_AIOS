import { WorkflowCommand } from "./types/WorkflowTypes.js";

import { IWorkflow } from "./interfaces/IWorkflow.js";

export class WorkflowRegistry {

    private readonly registry =
        new Map<WorkflowCommand, IWorkflow>();

    public register(

        command: WorkflowCommand,

        workflow: IWorkflow

    ): void {

        this.registry.set(
            command,
            workflow
        );

    }

    public resolve(

        command: WorkflowCommand

    ): IWorkflow | undefined {

        return this.registry.get(
            command
        );

    }

}
