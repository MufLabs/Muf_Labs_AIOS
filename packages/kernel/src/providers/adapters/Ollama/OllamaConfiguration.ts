import { OpenAICompatibleConfiguration } from "../OpenAICompatible";

export class OllamaConfiguration implements OpenAICompatibleConfiguration {

    /**
     * API Key.
     * Ollama no la utiliza.
     */
    public apiKey: string = "";

    /**
     * URL base.
     */
    public baseUrl: string = "http://localhost:11434/v1";

    /**
     * Modelo por defecto.
     */
    public defaultModel: string = "llama3";

    /**
     * Organización.
     */
    public organization?: string;

    /**
     * Proyecto.
     */
    public project?: string;

    /**
     * Timeout.
     */
    public timeout: number = 60000;

    /**
     * Reintentos.
     */
    public retries: number = 1;

    /**
     * TLS.
     */
    public verifyTls: boolean = false;

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