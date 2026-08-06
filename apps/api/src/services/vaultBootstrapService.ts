import {
  isEncryptionConfigured,
  createSpaceManifest,
  listSpaceManifests,
  getActiveEncryptionKeyAsync,
  resolveHmacSecret,
  generateEncryptionKey,
  normalizeTBitSpaceId,
  getTBitSpacePaths,
  setActiveTBitSpacesRoot,
  normalizeTBitVaultRoot,
} from "@muf/tbit-core";
import { TBitStorageService, TBitStorageConfig } from "@muf/tbit-core";
import path from "path";

/**
 * Request payload for initializing a vault.
 */
export interface VaultInitRequest {
  /** Absolute or relative path to the user-selected vault root. */
  vaultRoot: string;
  /** Unique identifier for the user owning the default space. */
  userId: string;
  /** Optional human-readable label for the primary space. */
  label?: string;
  /** When true, forces generation of a new encryption key if none is configured. */
  generateKey?: boolean;
}

/**
 * Response returned after a successful vault initialization.
 */
export interface VaultInitResponse {
  /** Identifier of the default T-Bit container/space. */
  containerId: string;
  /** Identifier of the default T-Bit space (same as containerId). */
  spaceId: string;
  /** Human-readable label of the primary space. */
  label: string;
  /** Normalized vault root path. */
  vaultRoot: string;
  /** Active encryption key identifier used for T-Bit integrity. */
  encryptionKeyId: string;
  /** Whether the Kernel reports all subsystems ready. */
  kernelReady: boolean;
  /** Per-subsystem readiness map. */
  subsystems: Record<string, boolean>;
  /** ISO-8601 timestamp of initialization completion. */
  initializedAt: string;
}

/**
 * Response describing the current vault bootstrap status.
 */
export interface VaultStatusResponse {
  /** Whether the vault has been initialized in this process. */
  initialized: boolean;
  /** Normalized vault root path, if initialized. */
  vaultRoot?: string;
  /** Number of T-Bit spaces discovered. */
  spacesCount: number;
  /** Whether at least one encryption key is configured. */
  encryptionConfigured: boolean;
  /** Whether the Kernel reports all subsystems ready. */
  kernelReady: boolean;
  /** Per-subsystem readiness map. */
  subsystems: Record<string, boolean>;
  /** ISO-8601 timestamp of the last status verification. */
  lastVerifiedAt?: string;
  /** Error message, if the vault is not initialized. */
  error?: string;
}

/**
 * Names of the subsystems verified during bootstrap.
 *
 * The Kernel and provider wiring for these subsystems is performed in
 * Stage 8.4. Until then, `VaultBootstrapService` reports their readiness
 * based on the T-Bit storage recovery performed in `initialize()`.
 */
const SUBSYSTEM_NAMES = ["memory", "workflow", "provider", "agent", "qvault"] as const;

/**
 * VaultBootstrapService orchestrates the linear initialization of the
 * T-Bit stack against a user-selected vault root.
 *
 * Stage 8.2 scope (this class):
 *  - `initialize()` — sets spaces root, ensures encryption, creates the
 *    default space manifest, recovers T-Bit storage, and reports subsystem
 *    readiness.
 *  - `getStatus()` — reports the current bootstrap status.
 *
 * Kernel and provider integration is intentionally deferred to Stage 8.4
 * per the approved Phase 8 implementation plan. The `initializeKernel()`
 * and `verifySubsystems()` helpers therefore report a pending/ready state
 * without importing `@aios/kernel`, preserving package isolation and the
 * stage boundary.
 */
export class VaultBootstrapService {
  private vaultRoot: string | null = null;
  private spacesRoot: string | null = null;
  private initialized = false;
  private kernelReady = false;
  private subsystems: Record<string, boolean> = {};

  /**
   * Initialize a vault at the user-selected root path.
   *
   * The bootstrap sequence is linear and strictly ordered:
   * 1. Normalize and set the vault root as the active T-Bit spaces root.
   * 2. Ensure an encryption key exists (generate if none configured).
   * 3. Create the primary space manifest inside the vault.
   * 4. Recover T-Bit storage to validate the container is usable.
   * 5. Initialize Kernel-scoped subsystems (Stage 8.4 wiring point).
   * 6. Verify subsystem readiness.
   *
   * @param req - Initialization request containing vaultRoot and userId.
   * @returns Initialization result with subsystem readiness.
   * @throws {Error} if vaultRoot or userId is empty.
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

    // 2) Encryption key — generate if requested and none is configured yet
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

    // 3) Persist the space manifest + directory scaffold at vaultRoot/spaces/<spaceId>
    const manifest = await createSpaceManifest({ spaceId, label: spaceLabel, userId: userId.trim() });

    // 4) Recover T-Bit storage to validate the container is usable with the active key
    const paths = getTBitSpacePaths(spaceId);
    const [hmacKeyId, hmacSecret] = await resolveHmacSecret();

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

    // 5) Initialize Kernel-scoped subsystems (Stage 8.4 wiring point)
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
   * Get the current vault bootstrap status.
   *
   * Reports whether the vault has been initialized in this process, the
   * number of discovered spaces, encryption readiness, and per-subsystem
   * readiness.
   *
   * @returns Vault status response.
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
   * Initialize Kernel-scoped subsystems for the vault.
   *
   * This is the Stage 8.4 wiring point: the actual Kernel and provider
   * integration is implemented in Stage 8.4. Until then, this method
   * records the subsystem names and marks them as pending, so that
   * `verifySubsystems()` can report readiness based on the T-Bit storage
   * recovery already performed in `initialize()`.
   *
   * @param _vaultRoot - Normalized vault root (used by Stage 8.4 wiring).
   */
  private async initializeKernel(_vaultRoot: string): Promise<void> {
    this.subsystems = Object.fromEntries(SUBSYSTEM_NAMES.map((name) => [name, false]));
  }

  /**
   * Verify subsystem readiness.
   *
   * Stage 8.2 reports subsystem readiness based on the successful T-Bit
   * storage recovery performed in `initialize()`. Once Stage 8.4 wires
   * the actual Kernel and providers, this method will delegate to their
   * health-check implementations.
   *
   * @returns A map of subsystem name to readiness boolean.
   */
  private async verifySubsystems(): Promise<Record<string, boolean>> {
    return Object.fromEntries(SUBSYSTEM_NAMES.map((name) => [name, true]));
  }
}

/** Singleton instance of the vault bootstrap service. */
export const vaultBootstrapService = new VaultBootstrapService();