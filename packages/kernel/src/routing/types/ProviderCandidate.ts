import { IProvider } from "../../providers";

export interface ProviderCandidate {

    /**
     * Instancia del proveedor.
     */
    provider: IProvider;

    /**
     * Puntaje obtenido durante el routing.
     */
    score?: number;

    /**
     * Disponibilidad.
     */
    available?: boolean;

}