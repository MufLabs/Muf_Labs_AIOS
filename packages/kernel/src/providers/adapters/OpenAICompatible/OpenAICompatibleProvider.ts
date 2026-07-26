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
    ProviderResponse,
    ProviderToolCall
} from "../../ProviderResponse";

import {
    ProviderInfo
} from "../../ProviderInfo";

import {
    OpenAICompatibleClient
} from "./OpenAICompatibleClient";

import {
    OpenAICompatibleConfiguration
} from "./OpenAICompatibleConfiguration";

import {
    OpenAICompatibleErrorMapper
} from "./OpenAICompatibleErrorMapper";

import {
    OpenAICompatibleMapper
} from "./OpenAICompatibleMapper";

import {
    OpenAICompatibleModels
} from "./OpenAICompatibleModels";

import {
    OpenAICompatibleProviderInfo
} from "./OpenAICompatibleProviderInfo";

interface OpenAICompatibleChoice {

    message?: {

        content?: string;

        tool_calls?: ProviderToolCall[];

    };

    finish_reason?: string;

}

interface OpenAICompatibleUsage {

    prompt_tokens?: number;

    completion_tokens?: number;

    total_tokens?: number;

}

interface OpenAICompatibleChatCompletion {

    choices?: OpenAICompatibleChoice[];

    usage?: OpenAICompatibleUsage;

    [key: string]: unknown;

}

export class OpenAICompatibleProvider
    extends BaseProvider {

    public readonly id =
        OpenAICompatibleProviderInfo.id;

    public readonly name =
        OpenAICompatibleProviderInfo.name;

    protected readonly client:
        OpenAICompatibleClient;

    constructor(

        protected readonly configuration:
            OpenAICompatibleConfiguration

    ) {

        super();

        this.client =
            new OpenAICompatibleClient(
                configuration
            );

    }

    protected buildInfo(): ProviderInfo {

        return OpenAICompatibleProviderInfo;

    }

    public async initialize(): Promise<void> {

        if (

            this.info.models.length > 0

        ) {

            return;

        }

        this.info.models =

            await OpenAICompatibleModels.discover(

                this.configuration

            );

    }

    public async execute(

        request: ProviderRequest

    ): Promise<ProviderResponse> {

        try {

            const model =
                this.resolveModel(
                    request
                );

            const payload =
                OpenAICompatibleMapper
                    .toChatCompletionsRequest(

                        request,

                        model

                    );

            const response =
                await this.client.chatCompletions(

                    payload

                );

            const data =
                response.data as OpenAICompatibleChatCompletion;

            const choice =
                data.choices?.[0];

            const usage =
                data.usage;

            return {

                success: true,

                provider:
                    this.id,

                providerId:
                    this.id,

                model,

                content:
                    choice?.message?.content ??
                    "",

                finishReason:
                    choice?.finish_reason,

                usage:
                    usage
                        ? {

                            promptTokens:
                                usage.prompt_tokens,

                            completionTokens:
                                usage.completion_tokens,

                            totalTokens:
                                usage.total_tokens

                        }
                        : undefined,

                promptTokens:
                    usage?.prompt_tokens,

                completionTokens:
                    usage?.completion_tokens,

                totalTokens:
                    usage?.total_tokens,

                toolCalls:
                    choice?.message?.tool_calls,

                metadata:
                    data

            };

        }

        catch (error) {

            throw OpenAICompatibleErrorMapper.map(

                error,

                this.name

            );

        }

    }

    public async embeddings(

        input: string | string[],

        model?: string

    ): Promise<HttpResponse> {

        const payload =
            OpenAICompatibleMapper
                .toEmbeddingsRequest(

                    input,

                    model ??

                    this.configuration
                        .defaultModel

                );

        return this.client.embeddings(

            payload

        );

    }

    public async moderations(

        input: string,

        model?: string

    ): Promise<HttpResponse> {

        const payload =
            OpenAICompatibleMapper
                .toModerationRequest(

                    input,

                    model

                );

        return this.client.moderations(

            payload

        );

    }

    public async images(

        prompt: string,

        model?: string,

        size?: string,

        quality?: string,

        style?: string,

        count: number = 1

    ): Promise<HttpResponse> {

        const payload =
            OpenAICompatibleMapper
                .toImageGenerationRequest(

                    prompt,

                    model ??

                    this.configuration
                        .defaultModel,

                    size,

                    quality,

                    style,

                    count

                );

        return this.client
            .imageGenerations(

                payload

            );

    }

    public async speech(

        input: string,

        voice: string,

        model?: string,

        format: string = "mp3"

    ): Promise<HttpResponse> {

        const payload =
            OpenAICompatibleMapper
                .toSpeechRequest(

                    input,

                    model ??

                    this.configuration
                        .defaultModel,

                    voice,

                    format

                );

        return this.client.speech(

            payload

        );

    }

    public async availableModels():

        Promise<HttpResponse> {

        return this.client.getModels();

    }

    protected resolveModel(

        request: ProviderRequest

    ): string {

        if (

            request.model &&

            request.model.length > 0

        ) {

            return request.model;

        }

        return this.configuration
            .defaultModel;

    }

}