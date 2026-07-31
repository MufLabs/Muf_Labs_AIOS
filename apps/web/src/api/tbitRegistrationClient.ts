import { buildTBitApiHeaders } from "./tbit/tbitApiHeaders";

const API_BASE_URL = import.meta.env.VITE_TBIT_API_BASE_URL ?? "http://localhost:3000";

type RegistrationResult = {
  containerId: string;
  spaceId: string;
  label: string;
  offsets: { header: number; index: number; data: number };
};

type EncryptionKeyInfo = {
  keyId: string;
  status: string;
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
  async bootstrap(userId: string, label?: string): Promise<RegistrationResult> {
    const body = { spaceId: `user:${userId}`, label: label ?? `Space ${userId}` };

    const response = await fetch(`${API_BASE_URL}/api/v1/tbit/containers`, {
      method: "POST",
      headers: buildTBitApiHeaders(true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = ((await response.json()) as { error?: string }).error ?? "Registration failed";
      throw new Error(err);
    }

    const result = (await response.json()) as RegistrationResult;

    // Persist the container ID for subsequent API calls
    localStorage.setItem("tbit:activeContainerId", result.containerId);
    localStorage.setItem("tbit:activeSpaceId", result.spaceId);

    return result;
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
};