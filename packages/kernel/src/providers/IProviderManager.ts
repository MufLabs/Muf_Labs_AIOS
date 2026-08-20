import { type VaultProviderConfig } from "@aios/shared";

import { IProvider } from "./IProvider.js";
import { ProviderRequest } from "./ProviderRequest.js";
import { ProviderResponse } from "./ProviderResponse.js";

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

    /**
     * Stage 8.4 — Vault-aware fan-out initialization.
     *
     * Calls `provider.initializeProvider({ vaultContext })` on every
     * registered provider that supports it. Providers without a
     * vault-aware initializer are skipped. Failures from one provider
     * do not abort the fan-out; they are surfaced through the returned
     * map.
     *
     * @param config Vault provider configuration containing the active
     *               `VaultContext`.
     * @returns A map of provider id to readiness (`true` if the
     *          provider's `initializeProvider` succeeded, `false` if
     *          the provider threw or has no vault-aware initializer).
     */
    initializeAll(
        config: VaultProviderConfig
    ): Promise<Record<string, boolean>>;
}

