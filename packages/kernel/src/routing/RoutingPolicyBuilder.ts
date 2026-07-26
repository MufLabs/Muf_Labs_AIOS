import { RoutingPolicy } from "./RoutingPolicy";

export class RoutingPolicyBuilder {

    public build(): RoutingPolicy {

        return new RoutingPolicy();

    }

}