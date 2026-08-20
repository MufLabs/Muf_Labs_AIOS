import { ProviderInfo } from "../../ProviderInfo.js";
import { ProviderModel } from "../../ProviderModel.js";

export const OpenAICompatibleProviderInfo: ProviderInfo = {

    id: "openai-compatible",

    name: "OpenAI Compatible",

    vendor: "OpenAI Compatible",

    version: "1.0.0",

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

    requiresAuthentication: true

};
