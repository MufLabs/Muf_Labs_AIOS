import { readFile } from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import {
  TBitStorageService,
  TBitStorageConfig,
  EncryptionKeyMaterial,
  getActiveEncryptionKey,
  getActiveEncryptionKeyAsync,
  getEncryptionKeyRing,
  getEncryptionKeyStatus,
  generateEncryptionKey,
  isEncryptionConfigured,
  rememberMemory,
  getMemoryContext,
  getMemoryGraph,
  searchQueryIndex,
  rebuildQueryIndex,
  getContainerHealthReport,
  reconcileContainerHealth,
  TBitHealthReport,
  MemoryCoreRecord,
  MemoryCoreContextResult,
  MemoryGraph,
  QuerySearchRequest,
  QuerySearchResult,
  TBitAssetRecord,
  listAssets,
  getAssetStats,
  MarkdownImportResult,
  MarkdownImportRequest,
  importMarkdownDocument,
  UniversalDocumentImportRequest,
  UniversalDocumentImportResult,
  importUniversalDocument,
  importBinaryAsset,
  BinaryAssetImportResult,
  createSpaceManifest,
  listSpaceManifests,
  TBitSpaceManifest,
  normalizeTBitSpaceId,
  normalizeTBitVaultRoot,
  setActiveTBitSpacesRoot,
  getTBitSpacePaths,
} from "@muf/tbit-core";

export type ContainerCreateRequest = {
  spaceId: string;
  label?: string;
  vaultRoot?: string;
};

export type ContainerCreateResponse = {
  containerId: string;
  spaceId: string;
  label: string;
  ready: boolean;
  manifest?: TBitSpaceManifest;
};

export type MemoStoreRequest = {
  containerId?: string;
  userId?: string;
  text?: string;
  payload?: unknown;
  key?: string;
  domain?: string;
  collection?: string;
  tags?: string[];
  links?: string[];
  source?: string;
};

export type MemoStoreResponse = {
  key: string;
  checksum: string;
};

export type MemoRecallRequest = {
  containerId?: string;
  userId?: string;
  query: string;
  topK?: number;
};

export type MemoRecallResponse = {
  records: MemoryCoreRecord[];
  graph?: MemoryGraph;
};

export type EncryptionKeyInfo = {
  enabled: boolean;
  algorithm: string;
  activeKeyId: string;
  previousKeyIds: string[];
  keyCount: number;
};

export type SetupStatusResponse = {
  initialized: boolean;
  encryptionConfigured: boolean;
  spacesCount: number;
};

export type SetupBootstrapRequest = {
  userId: string;
  label?: string;
  generateKey?: boolean;
};

export type SetupBootstrapResponse = {
  containerId: string;
  spaceId: string;
  label: string;
  manifest: TBitSpaceManifest;
  encryptionKeyId: string;
  ready: boolean;
};

export type VaultInitRequest = {
  vaultRoot: string;
  userId: string;
  label?: string;
  generateKey?: boolean;
};

export type VaultInitResponse = {
  containerId: string;
  spaceId: string;
  label: string;
  vaultRoot: string;
  encryptionKeyId: string;
  kernelReady: boolean;
  subsystems: Record<string, boolean>;
};

export class TBitService {
  private storage: TBitStorageService | null = null;

  private async getStorage(): Promise<TBitStorageService> {
    if (this.storage) return this.storage;

    const hmacSecrets = new Map<string, string>();
    const secret = process.env.TBIT_HMAC_SECRET ?? "tbit-default-hmac";
    hmacSecrets.set("default", secret);

    const config: TBitStorageConfig = {
      name: process.env.TBIT_CONTAINER_NAME ?? "aios-default",
      containerPath: process.env.TBIT_CONTAINER_PATH ?? "./data/tbit/aios.tbit",
      metadataPath: process.env.TBIT_METADATA_PATH ?? "./data/tbit/aios.meta.json",
      walPath: process.env.TBIT_WAL_PATH ?? "./data/tbit/aios.wal.json",
      snapshotsDir: process.env.TBIT_SNAPSHOTS_DIR ?? "./data/tbit/snapshots",
      replicasDir: process.env.TBIT_REPLICAS_DIR ?? "./data/tbit/replicas",
      exportsDir: process.env.TBIT_EXPORTS_DIR ?? "./data/tbit/exports",
      lockPath: process.env.TBIT_LOCK_PATH ?? "./data/tbit/aios.lock",
      hmacSecrets,
      hmacKeyId: "default",
    };

    this.storage = new TBitStorageService(config);
    return this.storage;
  }

  /**
   * Create a T-Bit container AND persist an on-disk space manifest.
   * Uses the async key resolver so first-run setups with a generated key work.
   */
  async createContainer(req: ContainerCreateRequest): Promise<ContainerCreateResponse> {
    const storage = await this.getStorage();
    await storage.recover();
    await getActiveEncryptionKeyAsync();

    const manifest = await createSpaceManifest({
      spaceId: req.spaceId,
      label: req.label ?? `T-Bit ${req.spaceId}`,
      userId: req.spaceId,
    });

    return {
      containerId: manifest.spaceId,
      spaceId: manifest.spaceId,
      label: manifest.label,
      ready: true,
      manifest,
    };
  }

  // ─── First-run setup (Phase 3) ────────────────────────────────────

  /**
   * Report whether the system has been bootstrapped.
   * Frontend uses this to decide whether to show the setup wizard.
   */
  async getSetupStatus(): Promise<SetupStatusResponse> {
    const encryptionConfigured = await isEncryptionConfigured();
    const spaces = await listSpaceManifests();
    return {
      initialized: encryptionConfigured && spaces.length > 0,
      encryptionConfigured,
      spacesCount: spaces.length,
    };
  }

  /**
   * Run the full first-run bootstrap:
   * 1. (optionally) generate an AES-256-GCM key and persist it to the keyring file.
   * 2. Create the space directory tree + space.json manifest.
   * 3. Recover the storage container using the now-available key.
   *
   * This makes first-run self-service — no env vars required when `generateKey` is true.
   */
  async bootstrapSetup(req: SetupBootstrapRequest): Promise<SetupBootstrapResponse> {
    if (!req.userId?.trim()) {
      throw new Error("bootstrapSetup requiere userId.");
    }

    const spaceId = `user:${normalizeTBitSpaceId(req.userId)}`;
    const label = req.label ?? `AIOS Space ${req.userId}`;

    // 1) Encryption key — generate if requested and none is configured yet.
    let encryptionKeyId: string;
    const configured = await isEncryptionConfigured();
    if (req.generateKey && !configured) {
      const key = await generateEncryptionKey(`key-${normalizeTBitSpaceId(req.userId)}`);
      encryptionKeyId = key.id;
    } else {
      // Use existing key (env or persisted) or generate as a fallback.
      const key = configured
        ? await getActiveEncryptionKeyAsync()
        : await generateEncryptionKey(`key-${normalizeTBitSpaceId(req.userId)}`);
      encryptionKeyId = key.id;
    }

    // 2) Persist the space manifest + directory scaffold.
    const manifest = await createSpaceManifest({ spaceId, label, userId: req.userId });

    // 3) Recover storage to validate the container is usable with the active key.
    const storage = await this.getStorage();
    await storage.recover();

    return {
      containerId: manifest.spaceId,
      spaceId: manifest.spaceId,
      label: manifest.label,
      manifest,
      encryptionKeyId,
      ready: true,
    };
  }

  async storeMemo(req: MemoStoreRequest): Promise<MemoStoreResponse> {
    const storage = await this.getStorage();

    const record = await rememberMemory(storage, {
      userId: req.userId ?? "anonymous",
      text: req.text,
      payload: req.payload,
      ...(req.key ? { key: req.key } : {}),
      domain: req.domain,
      collection: req.collection,
      tags: req.tags,
      links: req.links,
      source: req.source,
    });

    return {
      key: record.key,
      checksum: record.checksum,
    };
  }

  async recallMemos(req: MemoRecallRequest): Promise<MemoRecallResponse> {
    const context = await getMemoryContext(
      req.userId ?? "anonimo",
      req.query,
      req.topK ?? 10,
    );

    const records = Array.isArray((context as MemoryCoreContextResult).matches)
      ? (context as MemoryCoreContextResult).matches
      : [];

    const graph = await getMemoryGraph(req.userId);
    return { records, graph };
  }

  async getMemoryContextForRecord(userId: string, query: string, limit?: number): Promise<MemoryCoreContextResult> {
    return getMemoryContext(userId, query, limit ?? 8);
  }

  async getMemoryGraph(userId: string): Promise<MemoryGraph> {
    return getMemoryGraph(userId);
  }

  async searchIndex(query: string, topK?: number): Promise<{ results: QuerySearchResult[] }> {
    const request: QuerySearchRequest = {
      query,
      limit: topK ?? 20,
    };
    const result = await searchQueryIndex(request);
    return { results: result.results };
  }

  async rebuildIndex(): Promise<void> {
    await rebuildQueryIndex();
  }

  async getHealth(): Promise<TBitHealthReport> {
    return getContainerHealthReport();
  }

  async reconcileHealth() {
    return reconcileContainerHealth();
  }

  getEncryptionKeyInfo(): EncryptionKeyInfo {
    const status = getEncryptionKeyStatus();
    return {
      enabled: status.enabled,
      algorithm: status.algorithm,
      activeKeyId: status.activeKeyId,
      previousKeyIds: status.previousKeyIds,
      keyCount: status.keyCount,
    };
  }

  getEncryptionKeyRing(): EncryptionKeyMaterial[] {
    return getEncryptionKeyRing();
  }

  async listAllAssets(userId?: string): Promise<TBitAssetRecord[]> {
    return listAssets(userId);
  }

  async getAssetStatistics(userId?: string) {
    return getAssetStats(userId);
  }

  async importBinaryAsset(filePath: string, assetType?: string): Promise<BinaryAssetImportResult> {
    const storage = await this.getStorage();
    const content = await readFile(filePath);
    const contentBase64 = content.toString("base64");
    const filename = filePath.split(/[/\\]/).pop() ?? "asset.bin";
    return importBinaryAsset(storage, {
      contentBase64,
      filename,
      userId: "aios",
      mimeType: assetType || undefined,
    });
  }

  async importMarkdownFile(filePath: string): Promise<MarkdownImportResult> {
    const storage = await this.getStorage();
    const fileBuffer = await readFile(filePath);
    const filename = filePath.split(/[/\\]/).pop() ?? "document.md";
    const request: MarkdownImportRequest = {
      userId: "aios",
      filename,
      content: fileBuffer.toString("utf-8"),
    };
    return importMarkdownDocument(storage, request);
  }

  async importUniversalFile(filePath: string): Promise<UniversalDocumentImportResult> {
    const storage = await this.getStorage();
    const fileBuffer = await readFile(filePath);
    const filename = filePath.split(/[/\\]/).pop() ?? "document.bin";
    const request: UniversalDocumentImportRequest = {
      userId: "aios",
      filename,
      contentBase64: fileBuffer.toString("base64"),
    };
    return importUniversalDocument(storage, request);
  }

  /**
   * Vault-aware bootstrap (Phase 8).
   * Initializes the full T-Bit stack against a user-selected vault root.
   * 1. Sets the vault root as the active spaces root
   * 2. Generates/uses encryption key
   * 3. Creates space manifest + directory scaffold at vaultRoot/spaces
   * 4. Recovers storage to validate container is usable
   */
  async bootstrapWithVault(req: VaultInitRequest): Promise<VaultInitResponse> {
    if (!req.vaultRoot?.trim()) {
      throw new Error("vaultRoot is required.");
    }
    if (!req.userId?.trim()) {
      throw new Error("userId is required.");
    }

    // 0) Normalize and set the vault root as the active spaces root
    const normalizedVaultRoot = normalizeTBitVaultRoot(req.vaultRoot.trim());
    const spacesRoot = path.join(normalizedVaultRoot, "spaces");
    setActiveTBitSpacesRoot(spacesRoot);

    const spaceId = `user:${normalizeTBitSpaceId(req.userId.trim())}`;
    const label = req.label?.trim() ?? `AIOS Space ${req.userId.trim()}`;

    // 1) Encryption key — generate if requested and none configured yet
    let encryptionKeyId: string;
    const configured = await isEncryptionConfigured();

    if (req.generateKey && !configured) {
      const key = await generateEncryptionKey(`key-${normalizeTBitSpaceId(req.userId.trim())}`);
      encryptionKeyId = key.id;
    } else {
      const key = configured
        ? await getActiveEncryptionKeyAsync()
        : await generateEncryptionKey(`key-${normalizeTBitSpaceId(req.userId.trim())}`);
      encryptionKeyId = key.id;
    }

    // 2) Persist space manifest + directory scaffold at vaultRoot/spaces/<spaceId>
    const manifest = await createSpaceManifest({ spaceId, label, userId: req.userId.trim() });

    // 3) Recover storage to validate container is usable with the active key
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

    return {
      containerId: manifest.spaceId,
      spaceId: manifest.spaceId,
      label: manifest.label,
      vaultRoot: normalizedVaultRoot,
      encryptionKeyId,
      kernelReady: true,
      subsystems: {
        memory: true,
        workflow: true,
        provider: true,
        agent: true,
        qvault: true,
      },
    };
  }
}
