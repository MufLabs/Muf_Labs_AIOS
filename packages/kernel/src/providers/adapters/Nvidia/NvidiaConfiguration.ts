import { OpenAICompatibleConfiguration } from "../OpenAICompatible";

export class NvidiaConfiguration implements OpenAICompatibleConfiguration {

    /**
     * API Key.
     */
    public apiKey: string = "";

    /**
     * URL base de NVIDIA NIM.
     */
    public baseUrl: string = "https://integrate.api.nvidia.com/v1";

    /**
     * Modelo por defecto.
     *
     * Puede cambiarse posteriormente por cualquier modelo
     * disponible en NVIDIA NIM.
     */
    public defaultModel: string = "openai/gpt-oss-120b";

    /**
     * Organización (no utilizada).
     */
    public organization?: string;

    /**
     * Proyecto (no utilizado).
     */
    public project?: string;

    /**
     * Timeout en milisegundos.
     */
    public timeout: number = 60000;

    /**
     * Número máximo de reintentos.
     */
    public retries: number = 3;

    /**
     * Verificación TLS.
     */
    public verifyTls: boolean = true;

    /**
     * Headers HTTP adicionales.
     */
    public defaultHeaders?: Record<string, string>;

    constructor(init?: Partial<OpenAICompatibleConfiguration>) {

        if (init) {
            Object.assign(this, init);
        }

    }

}