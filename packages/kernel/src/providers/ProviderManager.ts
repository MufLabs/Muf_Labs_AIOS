import { IProvider } from "./IProvider";
import { IProviderManager } from "./IProviderManager";
import { ProviderNotFoundError } from "./ProviderNotFoundError";
import { ProviderRequest } from "./ProviderRequest";
import { ProviderResponse } from "./ProviderResponse";

import {

    ProviderRegistry,
    ProviderSelector

} from "../registry";

export class ProviderManager implements IProviderManager {

    private readonly selector = new ProviderSelector();

    constructor(

        private readonly registry: ProviderRegistry

    ) { }

    public register(

        provider: IProvider

    ): void {

        this.registry.register(

            provider

        );

    }

    public unregister(

        providerId: string

    ): boolean {

        return this.registry.unregister(

            providerId

        );

    }

    public hasProvider(

        providerId: string

    ): boolean {

        return this.getProvider(

            providerId

        ) !== undefined;

    }

    public getProvider(

        providerId: string

    ): IProvider | undefined {

        return this.registry
            .getAll()
            .find(

                provider => provider.id === providerId

            );

    }

    public getProviders(): readonly IProvider[] {

        return this.registry.getAll();

    }

    public async execute(

        request: ProviderRequest

    ): Promise<ProviderResponse> {

        const provider = this.selector.select(

            this.registry.getAll()

        );

        if (!provider) {

            throw new ProviderNotFoundError(

                undefined,

                this.registry

                    .getAll()

                    .map(

                        provider => provider.id

                    )

            );

        }

        if (!(await provider.isAvailable())) {

            throw new Error(

                `Provider '${provider.id}' is not available.`

            );

        }

        return provider.execute(

            request

        );

    }

}