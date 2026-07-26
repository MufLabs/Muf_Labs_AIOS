import {
    ProviderInfo,
    ProviderModel
} from "../../";

export const OllamaProviderInfo: ProviderInfo = {

    id: "ollama",

    name: "Ollama",

    vendor: "Ollama",

    version: "1.0.0",

    baseUrl: "http://localhost:11434/v1",

    models: [] as ProviderModel[],

    capabilities: {

        chat: true,

        vision: false,

        audio: false,

        embeddings: true,

        tools: true,

        streaming: true,

        jsonMode: true,

        functionCalling: true,

        maxContextWindow: 131072

    },

    requiresAuthentication: false,

    defaultModel: "llama3"

};