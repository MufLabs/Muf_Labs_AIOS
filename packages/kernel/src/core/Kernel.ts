import { KernelContext } from "../context";

import {

    KernelRequest,
    KernelResponse

} from "../types";

import { IKernel } from "./IKernel";

import {

    ProviderManager

} from "../providers";

import {

    ProviderRegistry

} from "../registry";

import {

    ExecutionPipeline

} from "../execution";

export class Kernel implements IKernel {

    private readonly registry: ProviderRegistry;

    private readonly providerManager: ProviderManager;

    private readonly pipeline: ExecutionPipeline;

    constructor() {

        this.registry = new ProviderRegistry();

        this.providerManager = new ProviderManager(

            this.registry

        );

        this.pipeline = new ExecutionPipeline(

            this.providerManager

        );

    }

    /**
     * Permite registrar proveedores dinámicamente.
     */
    public get providers(): ProviderRegistry {

        return this.registry;

    }

    public async execute(

        context: KernelContext,

        request: KernelRequest

    ): Promise<KernelResponse> {

        const result = await this.pipeline.execute({

            kernel: context,

            request

        });

        return result.response;

    }

}