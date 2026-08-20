import { ProviderRegistry } from "./ProviderRegistry.js";
import { RegistryStatistics } from "./RegistryStatistics.js";

export class RegistryInspector {

    constructor(

        private readonly registry: ProviderRegistry

    ) { }

    public inspect(): RegistryStatistics {

        const providers = this.registry.getAll();

        return {

            totalProviders: providers.length,

            providerIds: providers.map(

                p => p.id

            ),

            providerNames: providers.map(

                p => p.name

            )

        };

    }

}
