import { OpenAICompatibleConfiguration } from "../OpenAICompatible";

export class OpenAIConfiguration implements OpenAICompatibleConfiguration {

    /**
     * API Key.
     */
    public apiKey: string = "";

    /**
     * URL base.
     */
    public baseUrl: string = "https://api.openai.com/v1";

    /**
     * Modelo por defecto.
     */
    public defaultModel: string = "gpt-5";

    /**
     * Organización (opcional).
     */
    public organization?: string;

    /**
     * Proyecto (opcional).
     */
    public project?: string;

    /**
     * Timeout.
     */
    public timeout: number = 60000;

    /**
     * Número de reintentos.
     */
    public retries: number = 3;

    /**
     * Verificación TLS.
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