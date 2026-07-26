import { KernelContext } from "../context";
import { KernelRequest } from "../types";

export interface PipelineContext {

    kernel: KernelContext;

    request: KernelRequest;

}