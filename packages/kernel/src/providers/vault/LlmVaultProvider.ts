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
 * Stage 8.4 — LLM Vault Provider
 *
 * Concrete `IProvider` implementation that resolves LLM context,
 * prompt cache, and embedding cache paths via the active
 * `VaultContext`. The LLM Gateway does not own storage; this
 * provider is the dependency-injected bridge that tells the
 * gateway where to read/write per-vault state.
 *
 * **Architecture compliance:**
 * - "Provider Architecture" (§16 Audit): the LLM gateway is
 *   platform-independent and vault-aware via dependency injection.
 * - "Kernel Responsibilities" (§16 Audit): Kernel orchestrates;
 *   the gateway never owns paths.
 */
export class LlmVaultProvider extends BaseProvider implements IProvider {
  public readonly id = "llm-vault";
  public readonly name = "LLM Vault Provider";

  private currentVaultId: string | null = null;
  private currentSpaceId: string | null = null;
  private currentPaths: ReturnType<typeof getTBitSpacePaths> | null = null;

  protected buildInfo(): ProviderInfo {
    return {
      id: this.id,
      name: this.name,
      vendor: "AIOS",
      version: "1.0.0",
      kind: "vault.llm",
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
      tags: ["vault", "llm", "context", "embeddings"],
      models: [],
      description:
        "Vault-aware LLM provider. Resolves prompt cache, context, " +
        "and embedding cache paths relative to the active vault.",
    };
  }

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
        "LlmVaultProvider has not been initialized. Call " +
          "Kernel.initializeProviders() first.",
      );
    }

    return {
      success: true,
      provider: this.id,
      content: "",
      model: "vault-llm",
      metadata: {
        vaultId: this.currentVaultId,
        spaceId: this.currentSpaceId,
        paths: this.currentPaths,
        echoed: request.metadata ?? null,
      },
    };
  }
}

