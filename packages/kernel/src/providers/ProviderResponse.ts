export interface ProviderContentPart {

    type: string;

    text?: string;

    imageUrl?: string;

    inputAudio?: {

        data: string;

        format: string;

    };

    metadata?: Record<string, unknown>;

}

export interface ProviderUsage {

    promptTokens?: number;

    completionTokens?: number;

    totalTokens?: number;

    cachedTokens?: number;

    reasoningTokens?: number;

    metadata?: Record<string, unknown>;

}

export interface ProviderToolCall {

    id: string;

    type: string;

    function?: {

        name: string;

        arguments: string;

    };

}

export interface ProviderResponse {

    /**
     * Indica si la operación fue exitosa.
     */
    success: boolean;

    /**
     * Contenido generado.
     */
    content: string;

    parts?: ProviderContentPart[];

    id?: string;

    created?: number;

    /**
     * Identificador del proveedor.
     */
    provider: string;

    /**
     * Alias mantenido por compatibilidad hacia atrás.
     */
    providerId?: string;

    /**
     * Modelo utilizado.
     */
    model: string;

    /**
     * Razón de finalización.
     */
    finishReason?: string;

    /**
     * Uso de tokens.
     */
    usage?: ProviderUsage;

    /**
     * Compatibilidad con implementaciones anteriores.
     */
    promptTokens?: number;

    completionTokens?: number;

    totalTokens?: number;

    /**
     * Llamadas a herramientas.
     */
    toolCalls?: ProviderToolCall[];

    /**
     * Tiempo de ejecución.
     */
    durationMs?: number;

    /**
     * Error devuelto por el proveedor.
     */
    error?: string;

    /**
     * Información adicional.
     */
    metadata?: Record<string, unknown>;

}