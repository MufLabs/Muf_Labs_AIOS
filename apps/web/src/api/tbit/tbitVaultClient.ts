import { buildTBitApiHeaders } from "./tbitApiHeaders";
import type {
  VaultConfig,
  VaultInitRequest,
  VaultInitResponse,
  VaultStatusResponse,
  VaultVerifyResponse,
  VaultConfigResponse,
} from "../../types/vault";

const API_BASE_URL = import.meta.env.VITE_TBIT_API_BASE_URL ?? "http://localhost:3000";

/**
 * T-Bit Vault Client
 * Handles vault lifecycle operations: init, status, verify, config, migrate, repair
 */
export const tbitVaultClient = {
  /**
   * Initialize a vault with user-selected root path.
   * Calls POST /api/v1/tbit/vault/init
   */
  async initVault(request: VaultInitRequest): Promise<VaultInitResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/vault/init`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = ((await response.json()) as { error?: string }).error ?? "Vault initialization failed";
      throw new Error(err);
    }

    return (await response.json()) as VaultInitResponse;
  },

  /**
   * Get current vault status.
   * Calls GET /api/v1/tbit/vault/status
   */
  async getVaultStatus(): Promise<VaultStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/vault/status`, {
      headers: buildTBitApiHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch vault status");
    }

    return (await response.json()) as VaultStatusResponse;
  },

  /**
   * Verify vault accessibility and structure.
   * Calls GET /api/v1/tbit/vault/verify
   */
  async verifyVault(vaultRoot: string): Promise<VaultVerifyResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/tbit/vault/verify?vaultRoot=${encodeURIComponent(vaultRoot)}`,
      {
        headers: buildTBitApiHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to verify vault");
    }

    return (await response.json()) as VaultVerifyResponse;
  },

  /**
   * Get vault configuration details.
   * Calls GET /api/v1/tbit/vault/config
   */
  async getVaultConfig(): Promise<VaultConfigResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/vault/config`, {
      headers: buildTBitApiHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Vault not initialized");
      }
      throw new Error("Failed to fetch vault config");
    }

    return (await response.json()) as VaultConfigResponse;
  },

  /**
   * Run schema migrations on vault.
   * Calls POST /api/v1/tbit/vault/migrate
   */
  async migrateVault(vaultRoot: string): Promise<{ ok: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/vault/migrate`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify({ vaultRoot }),
    });

    if (!response.ok) {
      const err = ((await response.json()) as { error?: string }).error ?? "Migration failed";
      throw new Error(err);
    }

    return (await response.json()) as { ok: boolean; message: string };
  },

  /**
   * Attempt corruption recovery on vault.
   * Calls POST /api/v1/tbit/vault/repair
   */
  async repairVault(vaultRoot: string): Promise<{ repaired: boolean; details: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/vault/repair`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify({ vaultRoot }),
    });

    if (!response.ok) {
      const err = ((await response.json()) as { error?: string }).error ?? "Repair failed";
      throw new Error(err);
    }

    return (await response.json()) as { repaired: boolean; details: string };
  },

  /**
   * Bootstrap vault using VaultConfig from File System Access API.
   * Convenience method that extracts rootPath from VaultConfig.
   */
  async bootstrapWithVaultConfig(
    vaultConfig: VaultConfig,
    userId: string,
    label?: string,
    generateKey = true
  ): Promise<VaultInitResponse> {
    return this.initVault({
      vaultRoot: vaultConfig.rootPath,
      userId,
      label: label ?? `AIOS Space ${userId}`,
      generateKey,
    });
  },
};