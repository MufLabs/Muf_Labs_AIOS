import { WorkflowCommand } from "../types/WorkflowTypes";

import { IWorkflow } from "../interfaces/IWorkflow";

export class WorkflowRegistry {

    private readonly registry =
        new Map<WorkflowCommand, IWorkflow>();

    register(

        command: WorkflowCommand,

        workflow: IWorkflow

    ) {

        this.registry.set(command, workflow);

    }

    resolve(command: WorkflowCommand) {

        return this.registry.get(command);

    }

}