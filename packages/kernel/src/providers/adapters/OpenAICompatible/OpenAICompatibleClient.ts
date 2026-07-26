import {
    HttpClient,
    HttpRequest,
    HttpResponse
} from "../../common";

import {
    OpenAICompatibleAuthentication
} from "./OpenAICompatibleAuthentication";

import {
    OpenAICompatibleConfiguration
} from "./OpenAICompatibleConfiguration";

export class OpenAICompatibleClient {

    private readonly httpClient: HttpClient;

    constructor(

        private readonly configuration: OpenAICompatibleConfiguration

    ) {

        this.httpClient = new HttpClient();

    }

    public async getModels(): Promise<HttpResponse> {

        return this.get(

            "/models"

        );

    }

    public async chatCompletions(

        request: unknown

    ): Promise<HttpResponse> {

        return this.post(

            "/chat/completions",

            request

        );

    }

    public async responses(

        request: unknown

    ): Promise<HttpResponse> {

        return this.post(

            "/responses",

            request

        );

    }

    public async embeddings(

        request: unknown

    ): Promise<HttpResponse> {

        return this.post(

            "/embeddings",

            request

        );

    }

    public async moderations(

        request: unknown

    ): Promise<HttpResponse> {

        return this.post(

            "/moderations",

            request

        );

    }

    public async imageGenerations(

        request: unknown

    ): Promise<HttpResponse> {

        return this.post(

            "/images/generations",

            request

        );

    }

    public async speech(

        request: unknown

    ): Promise<HttpResponse> {

        return this.post(

            "/audio/speech",

            request

        );

    }

    public async transcriptions(

        request: FormData

    ): Promise<HttpResponse> {

        return this.post(

            "/audio/transcriptions",

            request,

            false

        );

    }

    public async translations(

        request: FormData

    ): Promise<HttpResponse> {

        return this.post(

            "/audio/translations",

            request,

            false

        );

    }

    protected async get(

        endpoint: string

    ): Promise<HttpResponse> {

        const request: HttpRequest = {

            method: "GET",

            url:

                this.buildUrl(

                    endpoint

                ),

            headers:

                this.buildHeaders(),

            timeout:

                this.configuration.timeout

        };

        return this.httpClient.send(

            request

        );

    }

    protected async post(

        endpoint: string,

        body: unknown,

        serializeJson: boolean = true

    ): Promise<HttpResponse> {

        const headers =

            this.buildHeaders();

        if (

            serializeJson

        ) {

            headers["Content-Type"] =

                "application/json";

        }

        const request: HttpRequest = {

            method: "POST",

            url:

                this.buildUrl(

                    endpoint

                ),

            headers,

            body,

            timeout:

                this.configuration.timeout

        };

        return this.httpClient.send(

            request

        );

    }

    private buildHeaders(): Record<string, string> {

        const authentication =

            OpenAICompatibleAuthentication.create(

                this.configuration

            );

        const headers: Record<string, string> = {};

        if (

            authentication.bearerToken

        ) {

            headers.Authorization =

                `Bearer ${authentication.bearerToken}`;

        }

        if (

            authentication.organization

        ) {

            headers["OpenAI-Organization"] =

                authentication.organization;

        }

        if (

            authentication.project

        ) {

            headers["OpenAI-Project"] =

                authentication.project;

        }

        Object.assign(

            headers,

            authentication.additionalHeaders ?? {}

        );

        return headers;

    }

    private buildUrl(

        endpoint: string

    ): string {

        const baseUrl =

            this.configuration.baseUrl.endsWith("/")

                ? this.configuration.baseUrl.slice(

                    0,

                    -1

                )

                : this.configuration.baseUrl;

        const path =

            endpoint.startsWith("/")

                ? endpoint

                : `/${endpoint}`;

        return `${baseUrl}${path}`;

    }

}