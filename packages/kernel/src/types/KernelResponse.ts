export interface KernelResponse {

    /**
     * Operación exitosa.
     */
    success: boolean;

    /**
     * Contenido generado.
     */
    content: string;

    /**
     * Proveedor utilizado.
     */
    provider: string;

    /**
     * Modelo utilizado.
     */
    model: string;

    /**
     * Tokens de entrada.
     */
    promptTokens?: number;

    /**
     * Tokens de salida.
     */
    completionTokens?: number;

    /**
     * Total de tokens.
     */
    totalTokens?: number;

    /**
     * Duración.
     */
    durationMs?: number;

    /**
     * Información adicional.
     */
    metadata?: Record<string, unknown>;

}