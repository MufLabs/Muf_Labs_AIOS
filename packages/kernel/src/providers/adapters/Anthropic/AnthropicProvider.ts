import {
    HttpResponse
} from "../../common";

import {
    BaseProvider
} from "../../BaseProvider";

import {
    ProviderRequest
} from "../../ProviderRequest";

import {
    ProviderResponse
} from "../../ProviderResponse";

import {
    ProviderInfo
} from "../../ProviderInfo";

import {
    AnthropicClient
} from "./AnthropicClient";

import {
    AnthropicConfiguration
} from "./AnthropicConfiguration";

import {
    AnthropicErrorMapper
} from "./AnthropicErrorMapper";

import {
    AnthropicMapper
} from "./AnthropicMapper";

import {
    AnthropicModels
} from "./AnthropicModels";

import {
    AnthropicProviderInfo
} from "./AnthropicProviderInfo";

interface AnthropicMessageResponse {

    content?: Array<{

        type?: string;

        text?: string;

    }>;

    stop_reason?: string;

    usage?: {

        input_tokens?: number;

        output_tokens?: number;

    };

}

export class AnthropicProvider extends BaseProvider {

    public readonly id =
        AnthropicProviderInfo.id;

    public readonly name =
        AnthropicProviderInfo.name;


    protected readonly client:
        AnthropicClient;

    constructor(

        protected readonly configuration:
            AnthropicConfiguration

    ) {

        super();

        this.client =
            new AnthropicClient(
                configuration
            );

    }

    protected override buildInfo(): ProviderInfo {

        return AnthropicProviderInfo;

    }

    public async initialize(): Promise<void> {

        if (

            this.info.models.length > 0

        ) {

            return;

        }

        this.info.models =

            await AnthropicModels.discover(

                this.configuration

            );

    }

    public async execute(

        request: ProviderRequest

    ): Promise<ProviderResponse> {

        try {

            const model =
                this.resolveModel(request);

            const payload =
                AnthropicMapper.toMessagesRequest(

                    request,

                    model

                );

            const response =
                await this.client.messages(
                    payload
                );

            // El HttpResponse del kernel expone data como {},
            // por lo que realizamos un cast local.
            const data =
                (response as HttpResponse & {
                    data: AnthropicMessageResponse;
                }).data;

            const promptTokens =
                data.usage?.input_tokens;

            const completionTokens =
                data.usage?.output_tokens;

            const totalTokens =
                (promptTokens ?? 0) +
                (completionTokens ?? 0);

            const content =
                data.content
                    ?.map(
                        item => item.text ?? ""
                    )
                    .join("") ?? "";

            return {

                success: true,

                content,

                provider:
                    this.id,

                providerId:
                    this.id,

                model,

                finishReason:
                    data.stop_reason,

                usage: {

                    promptTokens,

                    completionTokens,

                    totalTokens

                },

                promptTokens,

                completionTokens,

                totalTokens,

                metadata: {

                    rawResponse:
                        data

                }

            };

        }
        catch (error) {

            throw AnthropicErrorMapper.map(

                error,

                this.name

            );

        }

    }

    public async availableModels():

        Promise<HttpResponse> {

        return this.client.getModels();

    }

    protected resolveModel(

        request: ProviderRequest

    ): string {

        const candidate =

            (request as Record<string, unknown>).model;

        if (

            typeof candidate === "string" &&

            candidate.length > 0

        ) {

            return candidate;

        }

        return this.configuration.defaultModel;

    }

}