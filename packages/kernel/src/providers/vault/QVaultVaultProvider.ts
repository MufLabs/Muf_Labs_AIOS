import {
  type VaultProviderConfig,
  getTBitSpacePaths,
  normalizeTBitSpaceId,
} from "@aios/shared";

import { BaseProvider } from "../BaseProvider";
import type { IProvider } from "../IProvider";
import { ProviderInfo } from "../ProviderInfo";
import { ProviderRequest } from "../ProviderRequest";
import { ProviderResponse } from "../ProviderResponse";

/**
 * Stage 8.4 — Q-Vault Vault Provider
 *
 * Concrete `IProvider` implementation that resolves Q-Vault
 * 3D/quantum asset paths via the active `VaultContext`.
 *
 * **Architecture compliance:**
 * - "Q-Vault Integration" (§16 Audit): Q-Vault initializes AFTER
 *   Kernel/Providers/Agents and reads/writes vault data through
 *   the standard provider contract.
 * - "Provider Architecture" (§16 Audit): no hardcoded paths.
 */
export class QVaultVaultProvider extends BaseProvider implements IProvider {
  public readonly id = "qvault-vault";
  public readonly name = "Q-Vault Vault Provider";

  private currentVaultId: string | null = null;
  private currentSpaceId: string | null = null;
  private currentPaths: ReturnType<typeof getTBitSpacePaths> | null = null;

  protected buildInfo(): ProviderInfo {
    return {
      id: this.id,
      name: this.name,
      vendor: "AIOS",
      version: "1.0.0",
      kind: "vault.qvault",
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
      tags: ["vault", "qvault", "3d", "tbit"],
      models: [],
      description:
        "Vault-aware Q-Vault provider. Resolves 3D asset and quantum " +
        "state paths relative to the active vault.",
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
        "QVaultVaultProvider has not been initialized. Call " +
          "Kernel.initializeProviders() first.",
      );
    }

    return {
      success: true,
      provider: this.id,
      content: "",
      model: "vault-qvault",
      metadata: {
        vaultId: this.currentVaultId,
        spaceId: this.currentSpaceId,
        paths: this.currentPaths,
        echoed: request.metadata ?? null,
      },
    };
  }
}
