import { IExecutionPipeline } from "./IExecutionPipeline";

import { PipelineContext } from "./PipelineContext";
import { PipelineResult } from "./PipelineResult";
import { PromptBuilder } from "./PromptBuilder";

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