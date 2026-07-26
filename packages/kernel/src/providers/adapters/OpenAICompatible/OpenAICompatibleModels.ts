import { HttpClient } from "../../common";
import { ProviderModel } from "../../ProviderModel";
import { OpenAICompatibleConfiguration } from "./OpenAICompatibleConfiguration";

interface OpenAICompatibleModelResponse {
    object: string;
    data: OpenAICompatibleRemoteModel[];
}

interface OpenAICompatibleRemoteModel {
    id: string;
    object: string;
    created?: number;
    owned_by?: string;
}

export class OpenAICompatibleModels {
    public static async discover(
        configuration: OpenAICompatibleConfiguration
    ): Promise<ProviderModel[]> {
        const http = new HttpClient();
        const response = await http.send<OpenAICompatibleModelResponse>({
            method: "GET",
            url: `${configuration.baseUrl}/models`,
            headers: {
                Authorization: `Bearer ${configuration.apiKey}`,
                ...(configuration.organization
                    ? {
                        "OpenAI-Organization":
                            configuration.organization
                    }
                    : {}),
                ...(configuration.project
                    ? {
                        "OpenAI-Project":
                            configuration.project
                    }
                    : {}),
                ...(configuration.defaultHeaders ?? {})
            },
            timeout: configuration.timeout
        });
        return this.map(

            response.data.data

        );
    }

    public static map(
        models: OpenAICompatibleRemoteModel[]
    ): ProviderModel[] {
        return models.map(
            model => ({
                id: model.id,
                name: model.id,
                contextWindow: 0,
                capabilities: {
                    chat: true,
                    vision: false,
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