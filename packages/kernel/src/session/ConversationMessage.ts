export type ConversationRole =
    | "system"
    | "user"
    | "assistant"
    | "tool";

export interface ConversationMessage {

    /**
     * Identificador único del mensaje.
     */
    id: string;

    /**
     * Rol del participante.
     */
    role: ConversationRole;

    /**
     * Contenido del mensaje.
     */
    content: string;

    /**
     * Fecha de creación.
     */
    timestamp: Date;

    /**
     * Información adicional.
     */
    metadata?: Record<string, unknown>;

}