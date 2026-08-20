import { IExecutionPipeline } from "./IExecutionPipeline.js";

import { PipelineContext } from "./PipelineContext.js";
import { PipelineResult } from "./PipelineResult.js";
import { PromptBuilder } from "./PromptBuilder.js";

import {
    IProviderManager
} from "../providers";

export class ExecutionPipeline implements IExecutionPipeline {

    private readonly promptBuilder =

        new PromptBuilder();

    constructor(

        private readonly providerManager: IProviderManager

    ) { }

    public async execute(

        context: PipelineContext

    ): Promise<PipelineResult> {

        const providerRequest =

            this.promptBuilder.build(

                context.request

            );

        const providerResponse =

            await this.providerManager.execute(

                providerRequest

            );

        return {

            response: {

                success: providerResponse.success,

                content: providerResponse.content,

                provider: providerResponse.provider,

                model: providerResponse.model,

                promptTokens: providerResponse.promptTokens,

                completionTokens: providerResponse.completionTokens,

                totalTokens: providerResponse.totalTokens,

                durationMs: providerResponse.durationMs,

                metadata: providerResponse.metadata

            }

        };

    }

}
