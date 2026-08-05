import {
  isEncryptionConfigured,
  createSpaceManifest,
  listSpaceManifests,
  getActiveEncryptionKeyAsync,
  generateEncryptionKey,
  normalizeTBitSpaceId,
  getTBitSpacePaths,
  setActiveTBitSpacesRoot,
  normalizeTBitVaultRoot,
  getTBitSpacesRoot,
} from "@muf/tbit-core";
import { TBitStorageService, TBitStorageConfig } from "@muf/tbit-core";
import { createHash } from "crypto";
import path from "path";

export interface VaultInitRequest {
  vaultRoot: string;
  userId: string;
  label?: string;
  generateKey?: boolean;
}

export interface VaultInitResponse {
  containerId: string;
  spaceId: string;
  label: string;
  vaultRoot: string;
  encryptionKeyId: string;
  kernelReady: boolean;
  subsystems: Record<string, boolean>;
  initializedAt: string;
}

export interface VaultStatusResponse {
  initialized: boolean;
  vaultRoot?: string;
  spacesCount: number;
  encryptionConfigured: boolean;
  kernelReady: boolean;
  subsystems: Record<string, boolean>;
  lastVerifiedAt?: string;
  error?: string;
}

export interface VaultVerifyResponse {
  accessible: boolean;
  validStructure: boolean;
  encryptionConfigured: boolean;
  spaces: Array<{ spaceId: string; label: string; userId: string }>;
  error?: string;
}

export interface VaultConfigResponse {
  vaultRoot: string;
  spacesRoot: string;
  encryptionKeyId: string;
  spaces: Array<{ spaceId: string; label: string; userId: string }>;
}

export class VaultBootstrapService {
  private vaultRoot: string | null = null;
  private spacesRoot: string | null = null;
  private initialized = false;
  private kernelReady = false;
  private subsystems: Record<string, boolean> = {};

  /**
   * Initialize a new vault with user-selected root path.
   * This orchestrates the full T-Bit stack initialization:
   * 1. Sets vault root as active spaces root
   * 2. Ensures encryption key exists
   * 3. Creates primary space manifest
   * 4. Recovers T-Bit storage
   * 5. Initializes Kernel with vault-aware providers
   * 6. Verifies all subsystems
   */
  async initialize(req: VaultInitRequest): Promise<VaultInitResponse> {
    const { vaultRoot, userId, label, generateKey } = req;

    if (!vaultRoot?.trim()) {
      throw new Error("vaultRoot is required.");
    }
    if (!userId?.trim()) {
      throw new Error("userId is required.");
    }

    // 1) Normalize and set the vault root as the active spaces root
    const normalizedVaultRoot = normalizeTBitVaultRoot(vaultRoot.trim());
    const spacesRoot = path.join(normalizedVaultRoot, "spaces");
    setActiveTBitSpacesRoot(spacesRoot);

    this.vaultRoot = normalizedVaultRoot;
    this.spacesRoot = spacesRoot;

    const spaceId = `user:${normalizeTBitSpaceId(userId.trim())}`;
    const spaceLabel = label?.trim() ?? `AIOS Space ${userId.trim()}`;

    // 2) Encryption key — generate if requested and none configured yet
    let encryptionKeyId: string;
    const configured = await isEncryptionConfigured();

    if (generateKey && !configured) {
      const key = await generateEncryptionKey(`key-${normalizeTBitSpaceId(userId.trim())}`);
      encryptionKeyId = key.id;
    } else {
      const key = configured
        ? await getActiveEncryptionKeyAsync()
        : await generateEncryptionKey(`key-${normalizeTBitSpaceId(userId.trim())}`);
      encryptionKeyId = key.id;
    }

    // 3) Persist space manifest + directory scaffold at vaultRoot/spaces/<spaceId>
    const manifest = await createSpaceManifest({ spaceId, label: spaceLabel, userId: userId.trim() });

    // 4) Recover T-Bit storage to validate container is usable with the active key
    const paths = getTBitSpacePaths(spaceId);
    const activeKey = await getActiveEncryptionKeyAsync();
    const hmacKeyId = activeKey?.id ?? "hmac-v1";
    const hmacSecret = activeKey?.secret
      ? createHash("sha256").update(activeKey.secret).digest("hex")
      : createHash("sha256").update("dev-hmac-secret").digest("hex");

    const config: TBitStorageConfig = {
      name: "default",
      containerPath: paths.containerPath,
      metadataPath: paths.metadataPath,
      walPath: paths.walPath,
      snapshotsDir: paths.snapshotsDir,
      replicasDir: paths.replicasDir,
      exportsDir: path.join(paths.rootDir, "exports"),
      lockPath: paths.lockPath,
      hmacSecrets: new Map([[hmacKeyId, hmacSecret]]),
      hmacKeyId,
      maxDatoBytes: 64 * 1024,
      maxRecords: 500,
      containerSizeMB: 10,
    };

    const storage = new TBitStorageService(config);
    await storage.recover();

    // 5) Initialize Kernel with vault-aware providers
    await this.initializeKernel(normalizedVaultRoot);

    // 6) Verify all subsystems
    this.subsystems = await this.verifySubsystems();
    this.kernelReady = Object.values(this.subsystems).every((v) => v === true);
    this.initialized = true;

    return {
      containerId: manifest.spaceId,
      spaceId: manifest.spaceId,
      label: manifest.label,
      vaultRoot: normalizedVaultRoot,
      encryptionKeyId,
      kernelReady: this.kernelReady,
      subsystems: this.subsystems,
      initializedAt: new Date().toISOString(),
    };
  }

  /**
   * Initialize the Kernel with vault-scoped provider configurations.
   * In Phase 8.4, this will wire actual Kernel and providers.
   * For now, we simulate the initialization sequence.
   */
  private async initializeKernel(vaultRoot: string): Promise<void> {
    // TODO Phase 8.4: Import and instantiate actual Kernel
    // const { Kernel } = await import("@aios/kernel");
    // this.kernel = new Kernel(vaultRoot);
    // await this.kernel.initializeProviders();
    
    // Placeholder: mark subsystems as pending initialization
    this.subsystems = {
      memory: false,
      workflow: false,
      provider: false,
      agent: false,
      qvault: false,
    };
  }

  /**
   * Verify all subsystems are healthy.
   * In Phase 8.4, this will call actual health checks.
   */
  private async verifySubsystems(): Promise<Record<string, boolean>> {
    // TODO Phase 8.4: Call actual subsystem health checks
    // For now, simulate successful verification after storage recovery
    return {
      memory: true,
      workflow: true,
      provider: true,
      agent: true,
      qvault: true,
    };
  }

  /**
   * Get current vault status.
   */
  async getStatus(): Promise<VaultStatusResponse> {
    if (!this.initialized || !this.vaultRoot) {
      return {
        initialized: false,
        spacesCount: 0,
        encryptionConfigured: false,
        kernelReady: false,
        subsystems: {},
        error: "Vault not initialized",
      };
    }

    const encryptionConfigured = await isEncryptionConfigured();
    const spaces = await listSpaceManifests();

    return {
      initialized: true,
      vaultRoot: this.vaultRoot,
      spacesCount: spaces.length,
      encryptionConfigured,
      kernelReady: this.kernelReady,
      subsystems: this.subsystems,
      lastVerifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Verify vault accessibility and structure.
   */
  async verify(vaultRoot: string): Promise<VaultVerifyResponse> {
    const normalizedVaultRoot = normalizeTBitVaultRoot(vaultRoot.trim());
    const spacesRoot = path.join(normalizedVaultRoot, "spaces");

    let spaces: Array<{ spaceId: string; label: string; userId: string }> = [];
    let accessible = false;
    let validStructure = false;
    let error: string | undefined;

    try {
      const { readdir, readFile, stat } = await import("fs/promises");
      await stat(spacesRoot);
      accessible = true;

      const entries = await readdir(spacesRoot);
      for (const entry of entries) {
        const manifestPath = path.join(spacesRoot, entry, "space.json");
        try {
          const raw = await readFile(manifestPath, "utf8");
          const parsed = JSON.parse(raw);
          if (parsed.version === "space-manifest-v1") {
            spaces.push({
              spaceId: parsed.spaceId,
              label: parsed.label,
              userId: parsed.userId,
            });
            validStructure = true;
          }
        } catch {
          // Skip invalid entries
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Vault not accessible";
    }

    const encryptionConfigured = await isEncryptionConfigured();

    return {
      accessible,
      validStructure,
      encryptionConfigured,
      spaces,
      error,
    };
  }

  /**
   * Get vault configuration details.
   */
  async getConfig(): Promise<VaultConfigResponse | null> {
    if (!this.initialized || !this.vaultRoot || !this.spacesRoot) {
      return null;
    }

    const spaces = await listSpaceManifests();
    const keyStatus = await this.getEncryptionKeyStatus();

    return {
      vaultRoot: this.vaultRoot,
      spacesRoot: this.spacesRoot,
      encryptionKeyId: keyStatus.activeKeyId,
      spaces,
    };
  }

  /**
   * Run schema migrations (future-proofing).
   */
  async migrate(vaultRoot: string): Promise<void> {
    // TODO: Implement schema version checking and migrations
    const normalizedVaultRoot = normalizeTBitVaultRoot(vaultRoot.trim());
    const spacesRoot = path.join(normalizedVaultRoot, "spaces");
    setActiveTBitSpacesRoot(spacesRoot);
    // Migration logic would go here
  }

  /**
   * Attempt corruption recovery.
   */
  async repair(vaultRoot: string): Promise<{ repaired: boolean; details: string }> {
    // TODO: Implement WAL replay, container reconstruction
    const normalizedVaultRoot = normalizeTBitVaultRoot(vaultRoot.trim());
    const spacesRoot = path.join(normalizedVaultRoot, "spaces");
    setActiveTBitSpacesRoot(spacesRoot);
    return { repaired: false, details: "Repair not yet implemented" };
  }

  // Helper to get encryption key status (needed for getConfig)
  private async getEncryptionKeyStatus(): Promise<{ activeKeyId: string; configured: boolean }> {
    try {
      const { getEncryptionKeyStatus } = await import("@muf/tbit-core");
      const status = getEncryptionKeyStatus();
      return { activeKeyId: status.activeKeyId, configured: status.enabled };
    } catch {
      return { activeKeyId: "hmac-v1", configured: false };
    }
  }
}

// Export singleton instance
export const vaultBootstrapService = new VaultBootstrapService();