import { KernelContext } from "../../context";

import { IProvider } from "../../providers";

import { RoutingRequest } from "./RoutingRequest";

export interface RoutingContext {

    /**
     * Contexto actual del Kernel.
     */
    kernel: KernelContext;

    /**
     * Solicitud de routing.
     */
    routing: RoutingRequest;

    /**
     * Proveedores disponibles para el proceso
     * de selección.
     */
    providers: readonly IProvider[];

}