import { OpenAICompatibleConfiguration } from "../OpenAICompatible";

export class LMStudioConfiguration implements OpenAICompatibleConfiguration {

    /**
     * API Key.
     * LM Studio normalmente no la requiere.
     */
    public apiKey: string = "";

    /**
     * URL base.
     */
    public baseUrl: string = "http://localhost:1234/v1";

    /**
     * Modelo por defecto.
     */
    public defaultModel: string = "local-model";

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