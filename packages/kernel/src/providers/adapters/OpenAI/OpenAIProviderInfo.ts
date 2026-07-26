import {
    ProviderInfo,
    ProviderModel
} from "../../";

export const OpenAIProviderInfo: ProviderInfo = {

    id: "openai",

    name: "OpenAI",

    vendor: "OpenAI",

    version: "1.0.0",

    baseUrl: "https://api.openai.com/v1",

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

    defaultModel: "gpt-5"

};