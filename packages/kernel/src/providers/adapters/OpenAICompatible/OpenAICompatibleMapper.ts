import { ProviderRequest } from "../../ProviderRequest";

export class OpenAICompatibleMapper {

    public static toChatCompletionsRequest(

        request: ProviderRequest,

        model: string

    ): Record<string, unknown> {

        let messages = request.messages;

        if ((!messages || messages.length === 0) && request.prompt) {

            messages = [];

            if (request.systemPrompt || request.system) {

                messages.push({

                    role: "system",

                    content:

                        request.systemPrompt ??

                        request.system ??

                        ""

                });

            }

            messages.push({

                role: "user",

                content: request.prompt

            });

        }

        const payload: Record<string, unknown> = {

            model,

            messages

        };

        if (request.temperature !== undefined) {

            payload.temperature = request.temperature;

        }

        if (request.topP !== undefined) {

            payload.top_p = request.topP;

        }

        if (request.maxTokens !== undefined) {

            payload.max_tokens = request.maxTokens;

        }

        if (request.stop !== undefined) {

            payload.stop = request.stop;

        }

        if (request.stream !== undefined) {

            payload.stream = request.stream;

        }

        if (request.tools) {

            payload.tools = request.tools;

        }

        if (request.toolChoice !== undefined) {

            payload.tool_choice = request.toolChoice;

        }

        if (request.responseFormat !== undefined) {

            payload.response_format = request.responseFormat;

        }

        if (request.user) {

            payload.user = request.user;

        }

        if (request.metadata) {

            Object.assign(payload, request.metadata);

        }

        return payload;

    }

    public static toEmbeddingsRequest(

        input: string | string[],

        model: string

    ): Record<string, unknown> {

        return {

            model,

            input

        };

    }

    public static toModerationRequest(

        input: string,

        model?: string

    ): Record<string, unknown> {

        const payload: Record<string, unknown> = {

            input

        };

        if (model) {

            payload.model = model;

        }

        return payload;

    }

    public static toImageGenerationRequest(

        prompt: string,

        model: string,

        size?: string,

        quality?: string,

        style?: string,

        count: number = 1

    ): Record<string, unknown> {

        const payload: Record<string, unknown> = {

            model,

            prompt,

            n: count

        };

        if (size) {

            payload.size = size;

        }

        if (quality) {

            payload.quality = quality;

        }

        if (style) {

            payload.style = style;

        }

        return payload;

    }

    public static toSpeechRequest(

        input: string,

        model: string,

        voice: string,

        format: string = "mp3"

    ): Record<string, unknown> {

        return {

            model,

            input,

            voice,

            response_format: format

        };

    }

    public static toTranscriptionRequest(

        model: string,

        file: Blob,

        language?: string,

        prompt?: string,

        temperature?: number

    ): FormData {

        const form = new FormData();

        form.append(

            "model",

            model

        );

        form.append(

            "file",

            file

        );

        if (language) {

            form.append(

                "language",

                language

            );

        }

        if (prompt) {

            form.append(

                "prompt",

                prompt

            );

        }

        if (temperature !== undefined) {

            form.append(

                "temperature",

                temperature.toString()

            );

        }

        return form;

    }

}