export interface OpenAICompatibleConfiguration {

    /**
     * API Key utilizada para autenticación.
     */
    apiKey: string;

    /**
     * URL base del proveedor.
     *
     * Ejemplos:
     *
     * https://api.openai.com/v1
     * http://localhost:1234/v1
     * http://localhost:8000/v1
     */
    baseUrl: string;

    /**
     * Modelo utilizado por defecto.
     */
    defaultModel: string;

    /**
     * Organización (OpenAI).
     */
    organization?: string;

    /**
     * Proyecto (OpenAI).
     */
    project?: string;

    /**
     * Timeout en milisegundos.
     */
    timeout?: number;

    /**
     * Número máximo de reintentos.
     */
    retries?: number;

    /**
     * Verificar certificados TLS.
     */
    verifyTls?: boolean;

    /**
     * Headers adicionales.
     */
    defaultHeaders?: Record<string, string>;

}