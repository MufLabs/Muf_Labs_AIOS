import {
  TBitStorageService,
  TBitContainer,
  TBitStorageConfig,
  TBitMetadata,
  TBitWalRecord,
  EncryptionKeyMaterial,
  getActiveEncryptionKey,
  getEncryptionKeyById,
  getEncryptionKeyRing,
  getEncryptionKeyStatus,
  normalizeTBitKey,
  normalizeUnicodeText,
  rememberMemory,
  recallMemory,
  getMemoryContext,
  getMemoryGraph,
  searchQueryIndex,
  rebuildQueryIndex,
  getContainerHealthReport,
  reconcileContainerHealth,
  TBitSpacePaths,
  getTBitSpacePaths,
  TBitContainerHealth,
  MemoryCoreRecord,
  MemoryGraph,
  QueryIndexEntry,
  TBitAssetRecord,
  TBitAssetStatus,
  TBitAssetIndex,
  listAssets,
  getAssetStats,
  registerAsset,
  deleteAsset,
  MarkdownImportResult,
  importMarkdownDocument,
  importBinaryAsset,
  importUniversalDocument,
} from "@muf/tbit-core";

import { randomUUID } from "node:crypto";

export type ContainerCreateRequest = {
  spaceId: string;
  label?: string;
  vaultRoot?: string;
};

export type ContainerCreateResponse = {
  containerId: string;
  spaceId: string;
  label: string;
  offsets: { header: number; index: number; data: number };
};

export type MemoStoreRequest = {
  containerId: string;
  content: string;
  tags?: string[];
  sourceUrl?: string;
};

export type MemoStoreResponse = {
  recordId: string;
  timestamp: number;
};

export type MemoRecallRequest = {
  containerId: string;
  query: string;
  topK?: number;
};

export type MemoRecallResponse = {
  records: MemoryCoreRecord[];
  graph?: MemoryGraph;
};

export type HealthResponse = {
  containerId: string;
  health: TBitContainerHealth;
};

export type EncryptionKeyResponse = {
  keyId: string;
  status: string;
};

export class TBitService {
  private readonly storage: TBitStorageService;
  private readonly containers: Map<string, TBitContainer> = new Map();

  constructor(config?: Partial<TBitStorageConfig>) {
    this.storage = new TBitStorageService(config);
  }

  // ─── Container lifecycle ────────────────────────────────

  async createContainer(req: ContainerCreateRequest): Promise<ContainerCreateResponse> {
    const containerId = `tbit-${randomUUID().slice(0, 8)}`;
    const keyMaterial = await getActiveEncryptionKey();

    const container = await this.storage.createContainer({
      containerId,
      spaceId: req.spaceId,
      label: req.label ?? `T-Bit ${containerId}`,
      encryptionKey: keyMaterial,
      vaultRoot: req.vaultRoot,
    });

    this.containers.set(containerId, container);

    return {
      containerId,
      spaceId: req.spaceId,
      label: container.label,
      offsets: {
        header: container.offsets.header,
        index: container.offsets.index,
        data: container.offsets.data,
      },
    };
  }

  async openContainer(containerId: string): Promise<TBitContainer> {
    const cached = this.containers.get(containerId);
    if (cached) return cached;

    const keyMaterial = await getActiveEncryptionKey();
    const container = await this.storage.openContainer({ containerId, encryptionKey: keyMaterial });
    this.containers.set(containerId, container);
    return container;
  }

  async closeContainer(containerId: string): Promise<void> {
    this.containers.delete(containerId);
  }

  // ─── Memo (memory) operations ───────────────────────────

  async storeMemo(req: MemoStoreRequest): Promise<MemoStoreResponse> {
    const container = await this.openContainer(req.containerId);

    const normalized = normalizeUnicodeText(req.content);
    const key = normalizeTBitKey(req.containerId);

    const record = await rememberMemory(container, {
      key,
      content: normalized,
      tags: req.tags ?? [],
      sourceUrl: req.sourceUrl,
      timestamp: Date.now(),
    });

    return {
      recordId: record.id ?? key,
      timestamp: Date.now(),
    };
  }

  async recallMemos(req: MemoRecallRequest): Promise<MemoRecallResponse> {
    const container = await this.openContainer(req.containerId);

    const records = await recallMemory(container, req.query, req.topK ?? 10);
    const graph = await getMemoryGraph(container);

    return { records, graph };
  }

  async getMemoryContext(containerId: string, recordId: string, depth?: number) {
    const container = await this.openContainer(containerId);
    return getMemoryContext(container, recordId, depth);
  }

  // ─── Query index ────────────────────────────────────────

  async searchIndex(containerId: string, query: string, topK?: number): Promise<QueryIndexEntry[]> {
    const container = await this.openContainer(containerId);
    return searchQueryIndex(container, query, topK ?? 20);
  }

  async rebuildIndex(containerId: string): Promise<void> {
    const container = await this.openContainer(containerId);
    await rebuildQueryIndex(container);
  }

  // ─── Container health ───────────────────────────────────

  async getHealth(containerId: string): Promise<HealthResponse> {
    const container = await this.openContainer(containerId);
    const health = await getContainerHealthReport(container);
    return { containerId, health };
  }

  async reconcileHealth(containerId: string): Promise<HealthResponse> {
    const container = await this.openContainer(containerId);
    const health = await reconcileContainerHealth(container);
    return { containerId, health };
  }

  // ─── Encryption keys ────────────────────────────────────

  async getEncryptionKeyInfo(): Promise<EncryptionKeyResponse> {
    const keyId = (await getActiveEncryptionKey()).id;
    const status = await getEncryptionKeyStatus(keyId);
    return { keyId, status };
  }

  async getEncryptionKeyRing(): Promise<EncryptionKeyMaterial[]> {
    return getEncryptionKeyRing();
  }

  // ─── Asset management ───────────────────────────────────

  async listContainerAssets(containerId: string): Promise<TBitAssetRecord[]> {
    const container = await this.openContainer(containerId);
    return listAssets(container);
  }

  async getAssetStats(containerId: string) {
    const container = await this.openContainer(containerId);
    return getAssetStats(container);
  }

  async importBinary(containerId: string, filePath: string, assetType?: string) {
    const container = await this.openContainer(containerId);
    return importBinaryAsset(container, filePath, assetType);
  }

  async importMarkdown(containerId: string, filePath: string): Promise<MarkdownImportResult> {
    const container = await this.openContainer(containerId);
    return importMarkdownDocument(container, filePath);
  }

  async importUniversal(containerId: string, filePath: string) {
    const container = await this.openContainer(containerId);
    return importUniversalDocument(container, filePath);
  }
}