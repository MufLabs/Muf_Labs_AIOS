// ─── Memory Core API Compatibility Layer ─────────────────────────────
// Provides backward-compatible function signatures for the API routes
// that expect the old functional API style from @aios/database

import {
  TBitStorageService,
  TBitStorageConfig,
} from "./TBitStorageService.js";
import { getTBitSpacePaths, normalizeTBitSpaceId } from "./tbitRuntimePaths.js";
import { resolveHmacSecret } from "./hmacSecret.js";
import { createHash } from "crypto";
import path from "path";
import {
  rememberMemory,
  recallMemory,
  getMemoryContext,
  getMemoryLinks,
  getMemoryGraph,
  deleteMemoryRecord,
  deleteMemoryRecordsBatch,
  rememberMemoryBatch,
  MemoryCoreRememberRequest,
  MemoryCoreRecord,
  MemoryCoreContextResult,
} from "./memoryCore.js";

/**
 * Create a default TBitStorageConfig for compatibility functions
 */
async function createDefaultStorage(): Promise<TBitStorageService> {
  const spaceId = normalizeTBitSpaceId("default");
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
  return storage;
}

// Singleton storage instance
let defaultStoragePromise: Promise<TBitStorageService> | null = null;

async function getDefaultStorage(): Promise<TBitStorageService> {
  if (!defaultStoragePromise) {
    defaultStoragePromise = createDefaultStorage();
  }
  return defaultStoragePromise;
}

/**
 * Wrap storage with memoryCore-compatible methods
 */
function createMemoryCoreStorage(storage: TBitStorageService) {
  return {
    inject: async (key: string, payload: string) => storage.inject(key, payload),
    injectMany: async (records: Array<{ key: string; payload: string }>) =>
      storage.injectMany(records),
    read: async (key: string) => {
      const result = await storage.recoverData(key);
      return result?.dato ?? null;
    },
    recover: async (key: string) => {
      const result = await storage.recoverData(key);
      return result?.dato ?? null;
    },
    collapse: async (key: string) => storage.collapse(key),
    collapseMany: async (keys: string[]) => storage.collapseMany(keys),
  };
}

/**
 * Remember a memory (legacy API compatibility)
 */
export async function rememberMemoryCompat(
  request: MemoryCoreRememberRequest
): Promise<MemoryCoreRecord> {
  const storage = await getDefaultStorage();
  const memoryCoreStorage = createMemoryCoreStorage(storage);
  return rememberMemory(memoryCoreStorage, request);
}

/**
 * Remember multiple memories in batch (legacy API compatibility)
 */
export async function rememberMemoryBatchCompat(
  requests: MemoryCoreRememberRequest[]
): Promise<MemoryCoreRecord[]> {
  const storage = await getDefaultStorage();
  const memoryCoreStorage = createMemoryCoreStorage(storage);
  return rememberMemoryBatch(memoryCoreStorage, requests);
}

/**
 * Recall a memory by key (legacy API compatibility)
 */
export async function recallMemoryCompat(
  keyInput: string
): Promise<MemoryCoreRecord & { rawPayload: string }> {
  const storage = await getDefaultStorage();
  const memoryCoreStorage = createMemoryCoreStorage(storage);
  return recallMemory(memoryCoreStorage, keyInput);
}

/**
 * Get memory context for user and query (legacy API compatibility)
 */
export async function getMemoryContextCompat(
  userId: string,
  queryInput: string,
  limit = 8
): Promise<MemoryCoreContextResult> {
  return getMemoryContext(userId, queryInput, limit);
}

/**
 * Get memory links and backlinks (legacy API compatibility)
 */
export async function getMemoryLinksCompat(keyInput: string): Promise<{
  key: string;
  links: string[];
  backlinks: string[];
}> {
  return getMemoryLinks(keyInput);
}

/**
 * Get memory graph (legacy API compatibility)
 */
export async function getMemoryGraphCompat(
  userId?: string
): Promise<{
  nodes: Array<{
    key: string;
    userId: string;
    tags: string[];
    links: string[];
    backlinks: string[];
    source: string;
    checksum: string;
    updatedAt: string;
  }>;
  links: Array<{
    sourceKey: string;
    targetKey: string;
    type: "quantum-link" | "backlink";
  }>;
  tags: Record<string, string[]>;
}> {
  return getMemoryGraph(userId);
}

/**
 * Delete a memory record (legacy API compatibility)
 */
export async function deleteMemoryRecordCompat(
  keyInput: string
): Promise<{
  ok: boolean;
  key: string;
  deleted: boolean;
  warning?: string;
}> {
  const storage = await getDefaultStorage();
  const memoryCoreStorage = createMemoryCoreStorage(storage);
  const result = await deleteMemoryRecord(memoryCoreStorage, keyInput);
  return {
    ok: true,
    key: result.key,
    deleted: result.removedFromIndex,
    warning: result.warning,
  };
}

/**
 * Delete multiple memory records in batch (legacy API compatibility)
 */
export async function deleteMemoryRecordsBatchCompat(
  keyInputs: string[]
): Promise<
  Array<{
    ok: boolean;
    key: string;
    deleted: boolean;
    warning?: string;
  }>
> {
  const storage = await getDefaultStorage();
  const memoryCoreStorage = createMemoryCoreStorage(storage);
  const results = await deleteMemoryRecordsBatch(memoryCoreStorage, keyInputs);
  return results.map((r) => ({
    ok: true,
    key: r.key,
    deleted: r.removedFromIndex,
    warning: r.warning,
  }));
}

