import { ProviderCandidate } from "./ProviderCandidate";

export interface RoutingResult {

    selected: ProviderCandidate;

    alternatives: readonly ProviderCandidate[];

}