export interface ProviderCapabilities {

    /**
     * Chat conversacional.
     */
    chat: boolean;

    /**
     * Entrada de imágenes.
     */
    vision: boolean;

    /**
     * Audio (entrada/salida).
     */
    audio: boolean;

    /**
     * Embeddings.
     */
    embeddings: boolean;

    /**
     * Tool Calling.
     */
    tools: boolean;

    /**
     * Streaming.
     */
    streaming: boolean;

    /**
     * JSON Mode / Structured Outputs.
     */
    jsonMode: boolean;

    /**
     * Function Calling.
     */
    functionCalling: boolean;

    /**
     * Entrada de documentos.
     */
    documents?: boolean;

    /**
     * Salida estructurada mediante esquemas.
     */
    structuredOutputs?: boolean;

    /**
     * Caché de prompts.
     */
    promptCaching?: boolean;

    /**
     * Batch Processing.
     */
    batch?: boolean;

    /**
     * Fine-tuning.
     */
    fineTuning?: boolean;

    /**
     * Moderación.
     */
    moderation?: boolean;

    /**
     * Generación de imágenes.
     */
    imageGeneration?: boolean;

    /**
     * Generación de audio.
     */
    speech?: boolean;

    /**
     * Transcripción.
     */
    transcription?: boolean;

    /**
     * Tamaño máximo de contexto soportado.
     */
    maxContextWindow?: number;

    /**
     * Información adicional específica del proveedor.
     */
    metadata?: Record<string, unknown>;

    /**
    * Salida multimodal.
    */
    multimodal?: boolean;

    /**
    * Razonamiento avanzado.
    */
    reasoning?: boolean;

}