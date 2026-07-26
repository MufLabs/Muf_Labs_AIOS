import { ICapabilityResolver } from "./ICapabilityResolver";

import {

    ProviderCandidate,
    RoutingCriteria

} from "./types";

export class CapabilityResolver implements ICapabilityResolver {

    public resolve(

        providers: ProviderCandidate[],

        criteria?: RoutingCriteria

    ): ProviderCandidate[] {

        if (!criteria?.capabilities?.length) {

            return providers;

        }

        return providers.filter(candidate =>

            criteria.capabilities!.every(capability => {

                const capabilities = candidate.provider.info.capabilities;

                switch (capability.toLowerCase()) {

                    case "chat":
                        return capabilities.chat;

                    case "vision":
                        return capabilities.vision;

                    case "audio":
                        return capabilities.audio;

                    case "embeddings":
                        return capabilities.embeddings;

                    case "tools":
                        return capabilities.tools;

                    case "streaming":
                        return capabilities.streaming;

                    case "json":
                    case "jsonmode":
                        return capabilities.jsonMode;

                    case "functioncalling":
                        return capabilities.functionCalling;

                    default:
                        return false;

                }

            })

        );

    }

}