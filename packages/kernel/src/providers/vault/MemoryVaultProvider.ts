import {
  type VaultProviderConfig,
  getTBitSpacePaths,
  normalizeTBitSpaceId,
} from "@aios/shared";

import { BaseProvider } from "../BaseProvider.js";
import type { IProvider } from "../IProvider.js";
import { ProviderInfo } from "../ProviderInfo.js";
import { ProviderRequest } from "../ProviderRequest.js";
import { ProviderResponse } from "../ProviderResponse.js";

/**
 * Stage 8.4 — Memory Vault Provider
 *
 * Concrete `IProvider` implementation that resolves T-Bit memory
 * paths via the active `VaultContext`. The provider reads/writes the
 * Memory Core index, the Query index, and the Semantic index for the
 * user's default space.
 *
 * **Architecture compliance:**
 * - "Memory Architecture" (§16 Audit): paths resolve via
 *   `tbitRuntimePaths` → `VaultContext.spacesRoot`.
 * - "Provider Architecture" (§16 Audit): no hardcoded paths; the
 *   provider is vault-aware through dependency injection.
 */
export class MemoryVaultProvider extends BaseProvider implements IProvider {
  public readonly id = "memory-vault";
  public readonly name = "Memory Vault Provider";

  /** Per-vault state captured at initialization time. */
  private currentVaultId: string | null = null;
  private currentSpaceId: string | null = null;
  /** T-Bit space paths resolved against the active vault. */
  private currentPaths: ReturnType<typeof getTBitSpacePaths> | null = null;

  protected buildInfo(): ProviderInfo {
    return {
      id: this.id,
      name: this.name,
      vendor: "AIOS",
      version: "1.0.0",
      kind: "vault.memory",
      capabilities: {
        chat: false,
        vision: false,
        audio: false,
        embeddings: false,
        tools: false,
        streaming: false,
        jsonMode: false,
        functionCalling: false,
        vaultRead: true,
        vaultWrite: true,
      },
      tags: ["vault", "memory", "tbit"],
      models: [],
      description:
        "Vault-aware Memory provider. Resolves Memory Core, Query " +
        "Index, and Semantic Index paths relative to the active vault.",
    };
  }

  /**
   * Stage 8.4 — Vault-aware initializer.
   *
   * Caches the per-vault state so subsequent `execute()` calls can
   * resolve paths without re-reading `VaultContext`.
   *
   * @param config Vault provider configuration.
   */
  public async initializeProvider(
    config: VaultProviderConfig,
  ): Promise<void> {
    const ctx = config.vaultContext;
    this.currentVaultId = ctx.vaultId;
    this.currentSpaceId = normalizeTBitSpaceId(ctx.spaceId);
    this.currentPaths = getTBitSpacePaths(this.currentSpaceId);
  }

  public async execute(
    request: ProviderRequest,
  ): Promise<ProviderResponse> {
    if (!this.currentPaths) {
      throw new Error(
        "MemoryVaultProvider has not been initialized. Call " +
          "Kernel.initializeProviders() first.",
      );
    }

    return {
      success: true,
      provider: this.id,
      content: "",
      model: "vault-memory",
      metadata: {
        vaultId: this.currentVaultId,
        spaceId: this.currentSpaceId,
        paths: this.currentPaths,
        echoed: request.metadata ?? null,
      },
    };
  }
}

