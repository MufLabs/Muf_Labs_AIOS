import { KernelRequest } from "../../types";

import { RoutingCriteria } from "./RoutingCriteria";

export interface RoutingRequest {

    request: KernelRequest;

    criteria?: RoutingCriteria;

}