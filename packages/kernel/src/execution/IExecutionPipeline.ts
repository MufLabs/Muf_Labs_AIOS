import { PipelineContext } from "./PipelineContext";
import { PipelineResult } from "./PipelineResult";

export interface IExecutionPipeline {

    execute(

        context: PipelineContext

    ): Promise<PipelineResult>;

}