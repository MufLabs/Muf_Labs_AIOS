import { IProvider } from "./IProvider.js";
import { ProviderManager } from "./ProviderManager.js";

import { ProviderRegistry } from "../registry/index.js";

export class ProviderManagerFactory {

    /**
     * Crea una nueva instancia del administrador de proveedores.
     */
    public static create(

        providers?: readonly IProvider[]

    ): ProviderManager {

        const registry = new ProviderRegistry();

        if (providers) {

            for (const provider of providers) {

                registry.register(

                    provider

                );

            }

        }

        return new ProviderManager(

            registry

        );

    }

}
