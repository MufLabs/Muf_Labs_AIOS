import { IProvider } from "../providers";

export interface IProviderRegistry {

    /**
     * Registra un proveedor.
     */
    register(

        provider: IProvider

    ): void;

    /**
     * Elimina un proveedor.
     */
    unregister(

        id: string

    ): boolean;

    /**
     * Comprueba si existe un proveedor.
     */
    exists(

        id: string

    ): boolean;

    /**
     * Obtiene un proveedor por su identificador.
     */
    get(

        id: string

    ): IProvider | undefined;

    /**
     * Devuelve todos los proveedores registrados.
     *
     * La colección es de solo lectura.
     */
    getAll(): readonly IProvider[];

    /**
     * Elimina todos los proveedores.
     */
    clear(): void;

}