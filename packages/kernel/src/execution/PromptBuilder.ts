import {
    ProviderRequest
} from "../providers";

import {
    KernelRequest
} from "../types";

export class PromptBuilder {

    /**
     * Construye una ProviderRequest a partir de una KernelRequest.
     */
    public build(

        request: KernelRequest

    ): ProviderRequest {

        return {

            prompt: request.prompt,

            systemPrompt: request.systemPrompt,

            model: request.model,

            temperature: request.temperature,

            maxTokens: request.maxTokens

        };

    }

}