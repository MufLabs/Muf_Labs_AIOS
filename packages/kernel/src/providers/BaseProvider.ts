import { IProvider } from "./IProvider";
import { ProviderInfo } from "./ProviderInfo";
import { ProviderRequest } from "./ProviderRequest";
import { ProviderResponse } from "./ProviderResponse";

export abstract class BaseProvider implements IProvider {

    /**
     * Identificador único del proveedor.
     */
    public abstract readonly id: string;

    /**
     * Nombre visible.
     */
    public abstract readonly name: string;

    /**
    * Construye la información del proveedor.
    */
    protected abstract buildInfo(): ProviderInfo;

    /**
    * Caché interno de la información.
    */
    private _info?: ProviderInfo;

    /**
    * Información del proveedor.
    */
    public get info(): ProviderInfo {

        if (!this._info) {

            this._info = this.buildInfo();

        }

        return this._info;

    }

    /**
     * Comprueba si el proveedor está disponible.
     */
    public async isAvailable(): Promise<boolean> {

        return true;

    }

    /**
     * Ejecuta una solicitud.
     */
    public abstract execute(

        request: ProviderRequest

    ): Promise<ProviderResponse>;

    /**
     * Devuelve la información del proveedor.
     */
    public getInfo(): ProviderInfo {

        return this.info;

    }

    /**
     * Comprueba si soporta una capacidad determinada.
     */
    public supports(

        capability: keyof ProviderInfo["capabilities"]

    ): boolean {

        return Boolean(

            this.info.capabilities[capability]

        );

    }

}