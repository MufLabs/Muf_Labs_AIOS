import { IFallbackManager } from "./IFallbackManager";

import {

    ProviderCandidate

} from "./types";

export class FallbackManager implements IFallbackManager {

    public next(

        current: ProviderCandidate,

        providers: ProviderCandidate[]

    ): ProviderCandidate | undefined {

        if (providers.length === 0) {

            return undefined;

        }

        const index = providers.findIndex(

            provider =>

                provider.provider.id ===

                current.provider.id

        );

        if (index < 0) {

            return providers[0];

        }

        if (index + 1 >= providers.length) {

            return undefined;

        }

        return providers[index + 1];

    }

}