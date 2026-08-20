import { KernelRequest } from "../../types";

import { RoutingCriteria } from "./RoutingCriteria.js";

export interface RoutingRequest {

    request: KernelRequest;

    criteria?: RoutingCriteria;

}
