import { ProviderCapabilities } from "./ProviderCapabilities";

export interface ProviderModel {

    /**
     * Identificador único del modelo.
     */
    id: string;

    /**
     * Nombre visible.
     */
    name: string;

    /**
     * Ventana máxima de contexto.
     */
    contextWindow: number;

    /**
     * Tokens máximos de salida.
     */
    maxOutputTokens?: number;

    /**
     * Costo por millón de tokens de entrada.
     */
    inputCost?: number;

    /**
     * Costo por millón de tokens de salida.
     */
    outputCost?: number;

    /**
     * Puntuación relativa de velocidad.
     */
    speedScore?: number;

    /**
     * Puntuación relativa de calidad.
     */
    qualityScore?: number;

    /**
     * Indica si el modelo está deprecado.
     */
    deprecated?: boolean;

    /**
     * Fecha de lanzamiento.
     */
    releasedAt?: string;

    /**
     * Capacidades soportadas por el modelo.
     */
    capabilities: ProviderCapabilities;

    /**
     * Metadatos específicos del proveedor.
     */
    metadata?: Record<string, unknown>;

    /**
    * Alias del modelo.
    */
    aliases?: string[];

    /** 
     * Capacidad Desactivar Modelos sin eliminarlos.
     */
    enabled?: boolean;

}