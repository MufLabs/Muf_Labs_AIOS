import { buildTBitApiHeaders } from "./tbitApiHeaders";
import type { VaultConfig } from "../../types/vault";

const API_BASE_URL = import.meta.env.VITE_TBIT_API_BASE_URL ?? "http://localhost:3000";

type RegistrationResult = {
  containerId: string;
  spaceId: string;
  label: string;
  offsets?: { header: number; index: number; data: number };
};

type EncryptionKeyInfo = {
  keyId: string;
  status: string;
};

export type SetupStatus = {
  initialized: boolean;
  encryptionConfigured: boolean;
  spacesCount: number;
};

export type SetupBootstrapResult = {
  containerId: string;
  spaceId: string;
  label: string;
  manifest: {
    spaceId: string;
    label: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    version: "space-manifest-v1";
  };
  encryptionKeyId: string;
  ready: boolean;
};

/**
 * T-Bit Registration Client
 * Handles first-run container creation and encryption key initialization.
 */
export const tbitRegistrationClient = {
  /**
   * Bootstrap the user's T-Bit space.
   * Called once on first login (or when no container is detected).
   * Creates a T-Bit container and returns its ID so subsequent
   * memory/asset calls target the correct container.
   */
  async bootstrap(userId: string, label?: string, generateKey = true): Promise<RegistrationResult> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/setup/bootstrap`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify({ userId, label: label ?? `AIOS Space ${userId}`, generateKey }),
    });

    if (!response.ok) {
      const err = ((await response.json()) as { error?: string }).error ?? "Registration failed";
      throw new Error(err);
    }

    const result = (await response.json()) as SetupBootstrapResult;

    // Persist the container ID for subsequent API calls
    localStorage.setItem("tbit:activeContainerId", result.containerId);
    localStorage.setItem("tbit:activeSpaceId", result.spaceId);
    localStorage.setItem("tbit:userId", userId);

    return { containerId: result.containerId, spaceId: result.spaceId, label: result.label };
  },

  /**
   * Bootstrap the user's T-Bit space with a client-selected vault location.
   * Uses the new vault-aware API endpoint that initializes all subsystems
   * (Kernel, Memory, Workflow, Provider, Agent, Q-Vault) against the
   * user-chosen vault root.
   */
  async bootstrapWithVault(
    vaultConfig: VaultConfig,
    userId: string,
    label?: string,
    generateKey = true
  ): Promise<RegistrationResult> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/vault/init`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify({
        vaultRoot: vaultConfig.rootPath,
        userId,
        label: label ?? `AIOS Space ${userId}`,
        generateKey,
      }),
    });

    if (!response.ok) {
      const err = ((await response.json()) as { error?: string }).error ?? "Vault initialization failed";
      throw new Error(err);
    }

    const result = (await response.json()) as {
      containerId: string;
      spaceId: string;
      label: string;
      vaultRoot: string;
      encryptionKeyId: string;
      kernelReady: boolean;
      subsystems: Record<string, boolean>;
    };

    // Persist the container ID for subsequent API calls
    localStorage.setItem("tbit:activeContainerId", result.containerId);
    localStorage.setItem("tbit:activeSpaceId", result.spaceId);
    localStorage.setItem("tbit:userId", userId);
    localStorage.setItem("tbit:vaultRoot", result.vaultRoot);

    return { containerId: result.containerId, spaceId: result.spaceId, label: result.label };
  },

  /**
   * Fetch first-run setup status (authoritative, server-side).
   */
  async getSetupStatus(): Promise<SetupStatus> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/setup/status`, {
      headers: buildTBitApiHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch T-Bit setup status");
    return (await response.json()) as SetupStatus;
  },

  /**
   * Fetch encryption key status to confirm the container is ready.
   */
  async getEncryptionStatus(): Promise<EncryptionKeyInfo> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/encryption/keys`, {
      headers: buildTBitApiHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch encryption key status");
    }

    return (await response.json()) as EncryptionKeyInfo;
  },

  /**
   * Check if a container has already been bootstrapped for this user.
   */
  hasExistingContainer(): boolean {
    return !!localStorage.getItem("tbit:activeContainerId");
  },

  /**
   * Get the current container ID (or null if not bootstrapped).
   */
  getContainerId(): string | null {
    return localStorage.getItem("tbit:activeContainerId");
  },

  /**
   * Get the user id used during bootstrap (or null).
   */
  getUserId(): string | null {
    return localStorage.getItem("tbit:userId");
  },

  /**
   * Get the vault root path (or null if not set).
   */
  getVaultRoot(): string | null {
    return localStorage.getItem("tbit:vaultRoot");
  },
};
