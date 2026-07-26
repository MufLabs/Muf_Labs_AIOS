import { WorkflowCommand } from "../types/KernelTypes";

export interface WorkflowState {

    /**
     * Comando actualmente activo.
     */
    active: WorkflowCommand | null;

    /**
     * Inicio del workflow.
     */
    startedAt?: Date;

    /**
     * Finalización del workflow.
     */
    completedAt?: Date;

}