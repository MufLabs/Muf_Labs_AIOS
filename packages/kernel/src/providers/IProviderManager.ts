import { IProvider } from "./IProvider";
import { ProviderRequest } from "./ProviderRequest";
import { ProviderResponse } from "./ProviderResponse";

export interface IProviderManager {

    /**
     * Registra un proveedor.
     */
    register(

        provider: IProvider

    ): void;

    /**
     * Elimina un proveedor registrado.
     */
    unregister(

        providerId: string

    ): boolean;

    /**
     * Obtiene un proveedor por su identificador.
     */
    getProvider(

        providerId: string

    ): IProvider | undefined;

    /**
     * Obtiene todos los proveedores registrados.
     */
    getProviders(): readonly IProvider[];

    /**
     * Comprueba si existe un proveedor.
     */
    hasProvider(

        providerId: string

    ): boolean;

    /**
     * Ejecuta una solicitud utilizando el proveedor
     * seleccionado por el motor de enrutamiento.
     */
    execute(

        request: ProviderRequest

    ): Promise<ProviderResponse>;

}