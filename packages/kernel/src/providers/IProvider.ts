import { type VaultProviderConfig } from "@aios/shared";

import { ProviderInfo } from "./ProviderInfo.js";
import { ProviderRequest } from "./ProviderRequest.js";
import { ProviderResponse } from "./ProviderResponse.js";

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

    /**
     * Optional legacy init hook (pre-Stage 8.4).
     *
     * @deprecated Stage 8.4 — prefer `initializeProvider({ vaultContext })`.
     *             Retained for backward compatibility with providers that
     *             do not depend on vault state.
     */
    initialize?(): Promise<void>;

    /**
     * Stage 8.4 — Vault-aware initialization hook.
     *
     * Providers that need to resolve paths relative to the active
     * vault MUST implement this method. The Kernel calls it once per
     * provider via `ProviderManager.initializeAll({ vaultContext })`.
     *
     * Implementations MUST be idempotent: calling
     * `initializeProvider` twice with the same `vaultContext` is a
     * no-op. Implementations MUST derive every filesystem path from
     * `config.vaultContext.spacesRoot` (via `getTBitSpacePaths(...)`)
     * and MUST NOT hardcode paths.
     */
    initializeProvider?(config: VaultProviderConfig): Promise<void>;
}

