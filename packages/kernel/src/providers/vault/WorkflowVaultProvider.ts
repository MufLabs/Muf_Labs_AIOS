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
 * Stage 8.4 — Workflow Vault Provider
 *
 * Concrete `IProvider` implementation that resolves workflow
 * persistence paths via the active `VaultContext`. Workflow
 * definitions, executions, and logs are stored inside the user's
 * default space under the vault's `spaces/<spaceId>/` directory.
 *
 * **Architecture compliance:**
 * - "Workflow Architecture" (§16 Audit): Workflow definitions stored
 *   via T-Bit paths (the underlying persistence layer is owned by
 *   `@aios/database` in later phases; for Stage 8.4 the provider
 *   simply resolves the path surface).
 * - "Provider Architecture" (§16 Audit): no hardcoded paths.
 */
export class WorkflowVaultProvider extends BaseProvider implements IProvider {
  public readonly id = "workflow-vault";
  public readonly name = "Workflow Vault Provider";

  private currentVaultId: string | null = null;
  private currentSpaceId: string | null = null;
  private currentPaths: ReturnType<typeof getTBitSpacePaths> | null = null;

  protected buildInfo(): ProviderInfo {
    return {
      id: this.id,
      name: this.name,
      vendor: "AIOS",
      version: "1.0.0",
      kind: "vault.workflow",
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
      tags: ["vault", "workflow", "tbit"],
      models: [],
      description:
        "Vault-aware Workflow provider. Resolves workflow persistence " +
        "and execution log paths relative to the active vault.",
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
        "WorkflowVaultProvider has not been initialized. Call " +
          "Kernel.initializeProviders() first.",
      );
    }

    return {
      success: true,
      provider: this.id,
      content: "",
      model: "vault-workflow",
      metadata: {
        vaultId: this.currentVaultId,
        spaceId: this.currentSpaceId,
        paths: this.currentPaths,
        echoed: request.metadata ?? null,
      },
    };
  }
}

