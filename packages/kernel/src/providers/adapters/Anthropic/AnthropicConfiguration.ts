export interface AnthropicConfiguration {

    /**
     * API Key utilizada para autenticación.
     */
    apiKey: string;

    /**
     * URL base del proveedor.
     *
     * Ejemplo:
     *
     * https://api.anthropic.com
     */
    baseUrl: string;

    /**
     * Modelo utilizado por defecto.
     */
    defaultModel: string;

    /**
     * Versión de la API de Anthropic.
     *
     * Ejemplo:
     *
     * 2023-06-01
     */
    apiVersion?: string;

    /**
     * Beta headers opcionales.
     *
     * Ejemplo:
     *
     * messages-2023-12-15
     */
    beta?: string;

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