export interface ProviderMessage {

    role: "system" | "user" | "assistant" | "tool";

    content: string;

    name?: string;

    toolCallId?: string;

}

export interface ProviderTool {

    type: string;

    function?: {

        name: string;

        description?: string;

        parameters?: unknown;

    };

}

export interface ProviderRequest {

    /**
     * Prompt simple (modo simplificado).
     */
    prompt?: string;

    /**
     * Prompt del sistema (modo simplificado).
     */
    systemPrompt?: string;

    /**
     * Historial estilo Chat Completions.
     */
    messages?: ProviderMessage[];

    /**
     * Prompt del sistema estilo OpenAI/Anthropic.
     */
    system?: string;

    /**
     * Modelo solicitado.
     */
    model?: string;

    /**
     * Temperatura.
     */
    temperature?: number;

    /**
     * Top-P.
     */
    topP?: number;

    /**
     * Máximo número de tokens.
     */
    maxTokens?: number;

    /**
     * Streaming.
     */
    stream?: boolean;

    /**
     * Stop sequences.
     */
    stop?: string | string[];

    /**
     * Herramientas disponibles.
     */
    tools?: ProviderTool[];

    /**
     * Tool choice.
     */
    toolChoice?: unknown;

    /**
     * JSON / Structured Output.
     */
    responseFormat?: unknown;

    /**
     * User identifier.
     */
    user?: string;

    /**
     * Parámetros específicos del proveedor.
     */
    metadata?: Record<string, unknown>;

    /**
     * Para OpenAi, Gemini, Grok.
     */
    seed?: number;

    frequencyPenalty?: number;

    presencePenalty?: number;

    /**
    * Para Cancelar Requests.
    */
    timeout?: number;

    signal?: AbortSignal;

}