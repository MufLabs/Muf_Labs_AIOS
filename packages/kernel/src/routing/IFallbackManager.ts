import {

    ProviderCandidate

} from "./types";

export interface IFallbackManager {

    next(

        current: ProviderCandidate,

        providers: ProviderCandidate[]

    ): ProviderCandidate | undefined;

}