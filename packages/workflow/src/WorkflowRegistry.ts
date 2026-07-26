import { WorkflowCommand } from "./types/WorkflowTypes";

import { IWorkflow } from "./interfaces/IWorkflow";

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