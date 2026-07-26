import { IRoutingEngine } from "./IRoutingEngine";

import {

    CapabilityResolver

} from "./CapabilityResolver";

import {

    ProviderResolver

} from "./ProviderResolver";

import {

    RoutingPolicy

} from "./RoutingPolicy";

import {

    ModelSelector

} from "./ModelSelector";

import {

    RoutingContext,
    RoutingResult,
    ProviderCandidate

} from "./types";

export class RoutingEngine implements IRoutingEngine {

    private readonly capabilityResolver =
        new CapabilityResolver();

    private readonly providerResolver =
        new ProviderResolver();

    private readonly routingPolicy =
        new RoutingPolicy();

    private readonly modelSelector =
        new ModelSelector();

    public async route(

        context: RoutingContext

    ): Promise<RoutingResult> {

        let providers: ProviderCandidate[] =

            context.providers.map(

                provider => ({

                provider,

            available: true

        })

    );

        providers = this.capabilityResolver.resolve(

            providers,

            context.routing.criteria

        );

        providers = this.providerResolver.resolve(

            providers,

            context.routing.criteria

        );

        providers = this.routingPolicy.apply(

            providers,

            context.routing.criteria

        );

        const model = this.modelSelector.select(

            providers,

            context.routing.criteria

        );

        if (!model || providers.length === 0) {

            throw new Error(

                "No provider matched the routing criteria."

            );

        }

        return {

            selected: providers[0],

            alternatives: providers.slice(1)

        };

    }

}