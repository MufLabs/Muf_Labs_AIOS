export interface KernelRequest {

    /**
     * Prompt simple.
     */
    prompt?: string;

    /**
     * Historial conversacional.
     */
    messages?: {

        role:

            | "system"
            | "user"
            | "assistant"
            | "tool";

        content: string;

        name?: string;

    }[];

    /**
     * Prompt del sistema.
     */
    systemPrompt?: string;

    /**
     * Modelo solicitado.
     */
    model?: string;

    /**
     * Temperatura.
     */
    temperature?: number;

    /**
     * Máximo número de tokens.
     */
    maxTokens?: number;

    /**
     * Streaming.
     */
    stream?: boolean;

    /**
     * Usuario.
     */
    user?: string;

    /**
     * Parámetros adicionales.
     */
    metadata?: Record<string, unknown>;

}