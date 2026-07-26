import {

    ProviderCandidate,
    RoutingCriteria

} from "./types";

export interface IRoutingPolicy {

    apply(

        providers: ProviderCandidate[],

        criteria?: RoutingCriteria

    ): ProviderCandidate[];

}