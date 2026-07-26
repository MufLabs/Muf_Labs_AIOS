import {

    RoutingContext,
    RoutingResult

} from "./types";

export interface IRoutingEngine {

    route(

        context: RoutingContext

    ): Promise<RoutingResult>;

}