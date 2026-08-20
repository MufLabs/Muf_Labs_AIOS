import { PipelineContext } from "./PipelineContext.js";
import { PipelineResult } from "./PipelineResult.js";

export interface IExecutionPipeline {

    execute(

        context: PipelineContext

    ): Promise<PipelineResult>;

}
