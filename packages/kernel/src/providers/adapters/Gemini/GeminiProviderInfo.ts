import {
    ProviderInfo,
    ProviderModel
} from "../../";

export const GeminiProviderInfo: ProviderInfo = {

    id: "gemini",

    name: "Google Gemini",

    vendor: "Google",

    version: "1.0.0",

    baseUrl:
        "https://generativelanguage.googleapis.com/v1beta/openai",

    models: [] as ProviderModel[],

    capabilities: {

        chat: true,

        vision: true,

        audio: false,

        embeddings: true,

        tools: true,

        streaming: true,

        jsonMode: true,

        functionCalling: true,

        maxContextWindow: 1048576

    },

    requiresAuthentication: true,

    defaultModel: "gemini-2.5-pro"

};