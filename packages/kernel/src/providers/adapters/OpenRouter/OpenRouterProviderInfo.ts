import {
    ProviderInfo,
    ProviderModel
} from "../../";

export const OpenRouterProviderInfo: ProviderInfo = {

    id: "openrouter",

    name: "OpenRouter",

    vendor: "OpenRouter",

    version: "1.0.0",

    baseUrl: "https://openrouter.ai/api/v1",

    models: [] as ProviderModel[],

    capabilities: {

        chat: true,

        vision: true,

        audio: true,

        embeddings: true,

        tools: true,

        streaming: true,

        jsonMode: true,

        functionCalling: true,

        maxContextWindow: 1000000

    },

    requiresAuthentication: true,

    defaultModel: "openai/gpt-5"

};