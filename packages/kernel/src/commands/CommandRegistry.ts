import { WorkflowCommand } from "../workflow/WorkflowCommand";

export class CommandRegistry {

    private readonly commands =
        new Set<WorkflowCommand>([
            "Analyze",
            "Implement",
            "Document"
        ]);

    public register(
        command: WorkflowCommand
    ): void {

        this.commands.add(command);

    }

    public unregister(
        command: WorkflowCommand
    ): boolean {

        return this.commands.delete(command);

    }

    public exists(
        command: WorkflowCommand
    ): boolean {

        return this.commands.has(command);

    }

    public all(): WorkflowCommand[] {

        return [...this.commands];

    }

}