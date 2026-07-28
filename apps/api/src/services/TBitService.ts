import { readFile } from "fs/promises";
import {
  TBitStorageService,
  TBitStorageConfig,
  EncryptionKeyMaterial,
  getActiveEncryptionKey,
  getEncryptionKeyRing,
  getEncryptionKeyStatus,
  rememberMemory,
  recallMemory,
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

export class TBitService {
  private storage: TBitStorageService | null = null;

  /**
   * Lazy-init the storage service using runtime paths.
   * The T-Bit config is derived from environment or defaults.
   */
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

  // ─── Container lifecycle ────────────────────────────────

  async createContainer(req: ContainerCreateRequest): Promise<ContainerCreateResponse> {
    const storage = await this.getStorage();
    await storage.recover();

    // Ensure encryption key is active
    getActiveEncryptionKey();

    return {
      containerId: req.spaceId,
      spaceId: req.spaceId,
      label: req.label ?? `T-Bit ${req.spaceId}`,
      ready: true,
    };
  }

  // ─── Memo (memory) operations ───────────────────────────

  async storeMemo(req: MemoStoreRequest): Promise<MemoStoreResponse> {
    const storage = await this.getStorage();

    const record = await rememberMemory(storage, {
      userId: req.userId,
      text: req.text,
      payload: req.payload,
      key: req.key,
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
    // For query-based recall, use getMemoryContext (userId + query + limit)
    const context = await getMemoryContext(
      req.userId ?? "anonimo",
      req.query,
      req.topK ?? 10,
    );

    const graph = await getMemoryGraph(req.userId);

    return {
      records: context.records,
      graph,
    };
  }

  async getMemoryContextForRecord(userId: string, query: string, limit?: number): Promise<MemoryCoreContextResult> {
    return getMemoryContext(userId, query, limit ?? 8);
  }

  // ─── Query index ────────────────────────────────────────

  async searchIndex(query: string, topK?: number): Promise<{ results: QuerySearchResult[] }> {
    const request: QuerySearchRequest = {
      query,
      topK: topK ?? 20,
    };
    return searchQueryIndex(request);
  }

  async rebuildIndex(): Promise<void> {
    await rebuildQueryIndex();
  }

  // ─── Container health ───────────────────────────────────

  async getHealth(): Promise<TBitHealthReport> {
    return getContainerHealthReport();
  }

  async reconcileHealth() {
    return reconcileContainerHealth();
  }

  // ─── Encryption keys ────────────────────────────────────

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

  // ─── Asset management ───────────────────────────────────

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
    const request: MarkdownImportRequest = {
      filePath,
      userId: "aios",
    };
    return importMarkdownDocument(storage, request);
  }

  async importUniversalFile(filePath: string): Promise<UniversalDocumentImportResult> {
    const storage = await this.getStorage();
    const request: UniversalDocumentImportRequest = {
      filePath,
      userId: "aios",
    };
    return importUniversalDocument(storage, request);
  }
}