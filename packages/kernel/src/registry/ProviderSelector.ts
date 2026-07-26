import { IProvider } from "../providers";

export class ProviderSelector {

    /**
     * Selects the most appropriate provider.
     *
     * Current strategy:
     *  1. First available provider.
     *  2. Fallback to the first registered provider.
     *
     * This class is intentionally isolated so more advanced routing
     * (cost, latency, capabilities, model selection, load balancing,
     * failover, etc.) can be implemented later without changing the
     * ProviderManager.
     */
    public select(
        providers: readonly IProvider[]
    ): IProvider {

        if (providers.length === 0) {

            throw new Error(
                "No AI providers have been registered."
            );

        }

        return providers[0];

    }

}