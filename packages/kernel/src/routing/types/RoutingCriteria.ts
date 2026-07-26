export interface RoutingCriteria {

    /**
     * Modelo solicitado explícitamente.
     */
    model?: string;

    /**
     * Proveedor preferido.
     */
    provider?: string;

    /**
     * Capacidades requeridas.
     */
    capabilities?: string[];

    /**
     * Contexto mínimo requerido.
     */
    minimumContextWindow?: number;

    /**
     * Priorizar velocidad.
     */
    preferSpeed?: boolean;

    /**
     * Priorizar calidad.
     */
    preferQuality?: boolean;

    /**
     * Priorizar menor costo.
     */
    preferLowestCost?: boolean;

    /**
     * Solo proveedores locales.
     */
    localOnly?: boolean;

    /**
     * Permitir fallback.
     */
    allowFallback?: boolean;

}