import { KernelContext } from "../context";
import { KernelRequest, KernelResponse } from "../types";

export interface IKernel {

    execute(

        context: KernelContext,

        request: KernelRequest

    ): Promise<KernelResponse>;

}