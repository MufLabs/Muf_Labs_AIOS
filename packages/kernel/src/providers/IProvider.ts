import { ProviderInfo } from "./ProviderInfo";
import { ProviderRequest } from "./ProviderRequest";
import { ProviderResponse } from "./ProviderResponse";

export interface IProvider {

    /**
     * Identificador único del proveedor.
     */
    readonly id: string;

    /**
     * Nombre visible del proveedor.
     */
    readonly name: string;

    /**
     * Información completa del proveedor.
     */
    readonly info: ProviderInfo;

    /**
     * Indica si el proveedor está disponible.
     */
    isAvailable(): Promise<boolean>;

    /**
     * Ejecuta una petición al proveedor.
     */
    execute(

        request: ProviderRequest

    ): Promise<ProviderResponse>;

    /**
     * Devuelve la información del proveedor.
     */
    getInfo(): ProviderInfo;

    /**
     * Comprueba si el proveedor soporta una capacidad.
     */
    supports(

        capability: keyof ProviderInfo["capabilities"]

    ): boolean;

    /**
     * Para proveedores que necesitan inicialización.
     */
    dispose?(): Promise<void>;

    initialize?(): Promise<void>;

}