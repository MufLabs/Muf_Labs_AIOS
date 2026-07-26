import { IProvider } from "./IProvider";
import { ProviderManager } from "./ProviderManager";

import { ProviderRegistry } from "../registry";

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