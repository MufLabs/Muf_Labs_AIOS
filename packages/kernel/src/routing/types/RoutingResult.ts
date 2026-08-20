import { ProviderCandidate } from "./ProviderCandidate.js";

export interface RoutingResult {

    selected: ProviderCandidate;

    alternatives: readonly ProviderCandidate[];

}
