export interface KernelOptions {

    /**
     * Tiempo máximo de ejecución (ms).
     */
    timeout?: number;

    /**
     * Número máximo de reintentos.
     */
    retryCount?: number;

    /**
     * Permite utilizar caché.
     */
    cache?: boolean;

    /**
     * Habilita streaming.
     */
    streaming?: boolean;

    /**
     * Permite fallback entre proveedores.
     */
    allowFallback?: boolean;

    /**
     * Cancela la operación.
     */
    signal?: AbortSignal;

    /**
     * Parámetros adicionales.
     */
    metadata?: Record<string, unknown>;

}