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
 * Stage 8.4 — Agent Vault Provider
 *
 * Concrete `IProvider` implementation that resolves agent memory
 * paths via the active `VaultContext`. Agent prompts, knowledge
 * base caches, and temporary storage all live under the user's
 * default space inside the vault.
 *
 * **Architecture compliance:**
 * - "Agent Architecture" (§16 Audit): agent persistence scoped to
 *   the vault via `tbitRuntimePaths`.
 * - "Provider Architecture" (§16 Audit): no hardcoded paths.
 */
export class AgentVaultProvider extends BaseProvider implements IProvider {
  public readonly id = "agent-vault";
  public readonly name = "Agent Vault Provider";

  private currentVaultId: string | null = null;
  private currentSpaceId: string | null = null;
  private currentPaths: ReturnType<typeof getTBitSpacePaths> | null = null;

  protected buildInfo(): ProviderInfo {
    return {
      id: this.id,
      name: this.name,
      vendor: "AIOS",
      version: "1.0.0",
      kind: "vault.agent",
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
      tags: ["vault", "agent", "tbit"],
      models: [],
      description:
        "Vault-aware Agent provider. Resolves agent prompt library, " +
        "knowledge base, runtime cache, and temporary storage paths " +
        "relative to the active vault.",
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
        "AgentVaultProvider has not been initialized. Call " +
          "Kernel.initializeProviders() first.",
      );
    }

    return {
      success: true,
      provider: this.id,
      content: "",
      model: "vault-agent",
      metadata: {
        vaultId: this.currentVaultId,
        spaceId: this.currentSpaceId,
        paths: this.currentPaths,
        echoed: request.metadata ?? null,
      },
    };
  }
}

