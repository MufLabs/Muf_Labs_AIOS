import { type VaultProviderConfig } from "@aios/shared";

import { IProvider } from "./IProvider.js";
import { IProviderManager } from "./IProviderManager.js";
import { ProviderNotFoundError } from "./ProviderNotFoundError.js";
import { ProviderRequest } from "./ProviderRequest.js";
import { ProviderResponse } from "./ProviderResponse.js";

import {
    ProviderRegistry,
    ProviderSelector
} from "../registry/index.js";

export class ProviderManager implements IProviderManager {

    private readonly selector = new ProviderSelector();

    constructor(
        private readonly registry: ProviderRegistry
    ) { }

    public register(
        provider: IProvider
    ): void {

        this.registry.register(
            provider
        );

    }

    public unregister(
        providerId: string
    ): boolean {

        return this.registry.unregister(
            providerId
        );

    }

    public hasProvider(
        providerId: string
    ): boolean {

        return this.getProvider(
            providerId
        ) !== undefined;

    }

    public getProvider(
        providerId: string
    ): IProvider | undefined {

        return this.registry
            .getAll()
            .find(
                provider => provider.id === providerId
            );

    }

    public getProviders(): readonly IProvider[] {

        return this.registry.getAll();

    }

    public async execute(
        request: ProviderRequest
    ): Promise<ProviderResponse> {

        const provider = this.selector.select(
            this.registry.getAll()
        );

        if (!provider) {

            throw new ProviderNotFoundError(
                undefined,
                this.registry
                    .getAll()
                    .map(
                        provider => provider.id
                    )
            );

        }

        if (!(await provider.isAvailable())) {

            throw new Error(
                `Provider '${provider.id}' is not available.`
            );

        }

        return provider.execute(
            request
        );

    }

    /**
     * Stage 8.4 — Vault-aware fan-out initialization.
     *
     * Iterates every registered provider and invokes
     * `initializeProvider({ vaultContext })` on those that implement
     * the hook. A provider that throws during initialization is
     * reported as `false` in the readiness map but does not abort
     * the fan-out. Providers without the hook are reported as `false`
     * to keep the readiness contract uniform.
     *
     * @param config Vault provider configuration.
     * @returns Provider-id → readiness boolean map.
     */
    public async initializeAll(
        config: VaultProviderConfig
    ): Promise<Record<string, boolean>> {
        const readiness: Record<string, boolean> = {};
        const providers = this.registry.getAll();

        for (const provider of providers) {
            if (typeof provider.initializeProvider !== "function") {
                readiness[provider.id] = false;
                continue;
            }
            try {
                await provider.initializeProvider(config);
                readiness[provider.id] = true;
            } catch (error) {
                // Per-provider failures must NOT abort the fan-out
                // (per Phase 8 frozen decision: "Every subsystem
                // Initializes Through Bootstrap"). The failure is
                // surfaced through the readiness map so that
                // `VaultBootstrapService.verifySubsystems()` can
                // report it.
                readiness[provider.id] = false;
            }
        }

        return readiness;
    }
}
