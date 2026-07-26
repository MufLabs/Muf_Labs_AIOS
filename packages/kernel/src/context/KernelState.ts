import { ConversationMessage } from "../session/ConversationMessage";
import { WorkflowState } from "../workflow/WorkflowState";

export interface KernelState {

    /**
     * Identificador de la sesión.
     */
    sessionId: string;

    /**
     * Proyecto activo.
     */
    project?: string;

    /**
     * Agente activo.
     */
    activeAgent?: string;

    /**
     * Historial de conversación.
     */
    conversation: ConversationMessage[];

    /**
     * Estado del workflow.
     */
    workflow: WorkflowState;

    /**
     * Memoria temporal.
     */
    memory: Map<string, unknown>;

    /**
     * Información adicional.
     */
    metadata?: Record<string, unknown>;

}