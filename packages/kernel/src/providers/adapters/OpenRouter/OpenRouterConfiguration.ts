import { OpenAICompatibleConfiguration } from "../OpenAICompatible";

export class OpenRouterConfiguration implements OpenAICompatibleConfiguration {

    /**
     * API Key.
     */
    public apiKey: string = "";

    /**
     * URL base.
     */
    public baseUrl: string = "https://openrouter.ai/api/v1";

    /**
     * Modelo por defecto.
     */
    public defaultModel: string = "openai/gpt-5";

    /**
     * Organización (no utilizada por OpenRouter).
     */
    public organization?: string;

    /**
     * Proyecto (no utilizado por OpenRouter).
     */
    public project?: string;

    /**
     * Timeout.
     */
    public timeout: number = 60000;

    /**
     * Número máximo de reintentos.
     */
    public retries: number = 3;

    /**
     * Verificar certificados TLS.
     */
    public verifyTls: boolean = true;

    /**
     * Headers adicionales.
     */
    public defaultHeaders?: Record<string, string>;

    constructor(init?: Partial<OpenAICompatibleConfiguration>) {

        if (init) {

            Object.assign(this, init);

        }

    }

}