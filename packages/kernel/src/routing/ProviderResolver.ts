import { IProviderResolver } from "./IProviderResolver";

import {

    ProviderCandidate,
    RoutingCriteria

} from "./types";

export class ProviderResolver implements IProviderResolver {

    public resolve(

        providers: ProviderCandidate[],

        criteria?: RoutingCriteria

    ): ProviderCandidate[] {

        let candidates = [...providers];

        //
        // Provider solicitado explícitamente
        //
        if (criteria?.provider) {

            candidates = candidates.filter(candidate =>

                candidate.provider.id === criteria.provider ||

                candidate.provider.name === criteria.provider ||

                candidate.provider.info.vendor === criteria.provider

            );

        }

        //
        // Solo proveedores disponibles
        //
        candidates = candidates.filter(candidate =>

            candidate.available !== false

        );

        //
        // Solo proveedores locales
        //
        if (criteria?.localOnly) {

            candidates = candidates.filter(candidate =>

                candidate.provider.info.vendor.toLowerCase() === "local"

            );

        }

        return candidates;

    }

}