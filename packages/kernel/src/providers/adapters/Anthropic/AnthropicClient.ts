import {
    HttpClient,
    HttpRequest,
    HttpResponse
} from "../../common";

import {
    AnthropicAuthentication
} from "./AnthropicAuthentication";

import {
    AnthropicConfiguration
} from "./AnthropicConfiguration";

export class AnthropicClient {

    private readonly httpClient: HttpClient;

    constructor(

        private readonly configuration:
            AnthropicConfiguration

    ) {

        this.httpClient =
            new HttpClient();

    }

    public async getModels(): Promise<HttpResponse> {

        return this.get(

            "/v1/models"

        );

    }

    public async messages(

        request: unknown

    ): Promise<HttpResponse> {

        return this.post(

            "/v1/messages",

            request

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

            AnthropicAuthentication.create(

                this.configuration

            );

        const headers: Record<string, string> = {};

        if (

            authentication.bearerToken

        ) {

            headers["x-api-key"] =

                authentication.bearerToken;

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