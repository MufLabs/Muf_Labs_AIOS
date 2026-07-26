import { ProviderRegistry } from "./ProviderRegistry";
import { RegistryStatistics } from "./RegistryStatistics";

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