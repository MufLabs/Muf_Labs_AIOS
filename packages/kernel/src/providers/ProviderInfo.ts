import { ProviderCapabilities } from "./ProviderCapabilities";
import { ProviderModel } from "./ProviderModel";

export interface ProviderInfo {

    /**
     * Identificador único del proveedor.
     */
    id: string;

    /**
     * Nombre visible del proveedor.
     */
    name: string;

    /**
     * Organización o fabricante.
     */
    vendor: string;

    /**
     * Versión del proveedor.
     */
    version?: string;

    /**
     * URL base del servicio.
     */
    baseUrl?: string;

    /**
     * Sitio web oficial.
     */
    website?: string;

    /**
     * Modelos soportados.
     */
    models: ProviderModel[];

    /**
     * Capacidades soportadas por el proveedor.
     */
    capabilities: ProviderCapabilities;

    /**
     * Modelo predeterminado.
     */
    defaultModel?: string;

    /**
     * Indica si requiere autenticación.
     */
    requiresAuthentication?: boolean;

    /**
     * Metadatos adicionales específicos del proveedor.
     */
    metadata?: Record<string, unknown>;

    /**
     * Para que la UI los use.
     */
    icon?: string;

    logo?: string;

    /**
     * Proveedores que permiten listar modelos dinámicamente.
     */
    supportsModelDiscovery?: boolean;

    /**
     * Stage 8.4 — Provider category, e.g. "vault.memory", "llm",
     * "embedding", etc. Used by the Kernel to discover vault-aware
     * providers during fan-out initialization.
     */
    kind?: string;

    /**
     * Stage 8.4 — Free-form classification tags. The Kernel does
     * not interpret these tags; they are exposed for diagnostics
     * and UI presentation.
     */
    tags?: string[];

    /**
     * Stage 8.4 — Human-readable description of the provider's
     * role and capabilities. Surface for documentation, UI
     * tooltips, and diagnostic dashboards.
     */
    description?: string;
}
