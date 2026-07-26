import { OpenAICompatibleConfiguration } from "../OpenAICompatible";

export class GeminiConfiguration implements OpenAICompatibleConfiguration {

    public apiKey: string = "";

    public baseUrl: string =
        "https://generativelanguage.googleapis.com/v1beta/openai";

    public defaultModel: string = "gemini-2.5-pro";

    public organization?: string;

    public project?: string;

    public timeout: number = 60000;

    public retries: number = 3;

    public verifyTls: boolean = true;

    public defaultHeaders?: Record<string, string>;

    constructor(init?: Partial<OpenAICompatibleConfiguration>) {

        if (init) {
            Object.assign(this, init);
        }

    }

}