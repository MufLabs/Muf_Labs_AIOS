import {
    HttpClient
} from "../../common";

import {
    ProviderModel
} from "../../ProviderModel";

import {
    AnthropicConfiguration
} from "./AnthropicConfiguration";

import {
    AnthropicAuthentication
} from "./AnthropicAuthentication";

interface AnthropicModelsResponse {

    data: AnthropicRemoteModel[];

}

interface AnthropicRemoteModel {

    id: string;

    display_name?: string;

    created_at?: string;

    type?: string;

}

export class AnthropicModels {

    public static async discover(

        configuration: AnthropicConfiguration

    ): Promise<ProviderModel[]> {

        const authentication =

            AnthropicAuthentication.create(

                configuration

            );

        const headers: Record<string, string> = {

            "x-api-key":

                authentication.bearerToken ?? "",

            "Content-Type":

                "application/json"

        };

        Object.assign(

            headers,

            authentication.additionalHeaders ?? {}

        );

        const http =

            new HttpClient();

        const response =

            await http.send<AnthropicModelsResponse>({

                method: "GET",

                url:

                    `${configuration.baseUrl}/v1/models`,

                headers,

                timeout:

                    configuration.timeout

            });

        return this.map(

            response.data.data

        );

    }

    public static map(

        models: AnthropicRemoteModel[]

    ): ProviderModel[] {

        return models.map(

            model => ({

                id:

                    model.id,

                name:

                    model.display_name ??

                    model.id,

                contextWindow:

                    0,

                capabilities: {

                    chat: true,

                    vision: true,

                    audio: false,

                    embeddings: false,

                    tools: true,

                    streaming: true,

                    jsonMode: true,

                    functionCalling: true,

                    maxContextWindow: 0

                }

            })

        );

    }

}