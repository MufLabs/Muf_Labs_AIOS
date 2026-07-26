import {

    ProviderCandidate,
    RoutingCriteria

} from "./types";

export interface ICapabilityResolver {

    resolve(

        providers: ProviderCandidate[],

        criteria?: RoutingCriteria

    ): ProviderCandidate[];

}