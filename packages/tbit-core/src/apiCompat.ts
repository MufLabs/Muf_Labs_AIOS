// ─── API Compatibility Layer ────────────────────────────────────────
// Provides backward-compatible function signatures for the API routes
// that expect the old functional API style from @aios/database

import { TBitStorageService, TBitStorageConfig } from "./TBitStorageService";
import { getTBitSpacePaths, normalizeTBitSpaceId } from "./tbitRuntimePaths";
import { resolveHmacSecret } from "./hmacSecret";
import { createHash } from "crypto";
import path from "path";

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
 * Inject a single memory (legacy API compatibility)
 */
export async function injectMemory(
  key: string,
  payload: string,
  tags?: string[],
  source?: string,
  userId?: string
): Promise<{ ok: boolean; key: string }> {
  const storage = await getDefaultStorage();
  const record = {
    key,
    dato: payload,
    tags: tags?.join(",") ?? "",
    source: source ?? "api",
    userId: userId ?? "unknown",
    timestamp: new Date().toISOString(),
  };
  await storage.inject(key, JSON.stringify(record));
  return { ok: true, key };
}

/**
 * Inject multiple memories (legacy API compatibility)
 */
export async function injectManyMemories(
  records: Array<{
    key: string;
    payload: string;
    tags?: string[];
    source?: string;
    userId?: string;
  }>
): Promise<{ ok: boolean; count: number }> {
  const storage = await getDefaultStorage();
  for (const record of records) {
    const data = {
      key: record.key,
      dato: record.payload,
      tags: record.tags?.join(",") ?? "",
      source: record.source ?? "api",
      userId: record.userId ?? "unknown",
      timestamp: new Date().toISOString(),
    };
    await storage.inject(record.key, JSON.stringify(data));
  }
  return { ok: true, count: records.length };
}

/**
 * Recover data by key (legacy API compatibility)
 */
export async function recoverData(key: string): Promise<{
  ok: boolean;
  clave: string;
  dato: string;
} | null> {
  const storage = await getDefaultStorage();
  const result = await storage.recoverData(key);
  if (!result) return null;
  return { ok: true, clave: result.clave, dato: result.dato };
}

/**
 * Collapse a memory (legacy API compatibility)
 */
export async function collapseMemory(key: string): Promise<{
  ok: boolean;
  key: string;
  collapsed: boolean;
}> {
  const storage = await getDefaultStorage();
  await storage.collapse(key);
  return { ok: true, key, collapsed: true };
}

/**
 * Collapse multiple memories (legacy API compatibility)
 */
export async function collapseManyMemories(keys: string[]): Promise<{
  ok: boolean;
  results: Array<{ key: string; collapsed: boolean }>;
}> {
  const storage = await getDefaultStorage();
  const results = await storage.collapseMany(keys);
  return {
    ok: true,
    results: results.map((r) => ({ key: r.key, collapsed: r.collapsed })),
  };
}

/**
 * Snapshot container (legacy API compatibility)
 */
export async function snapshotContainer(
  label?: string
): Promise<{ ok: boolean; snapshotId: string }> {
  const storage = await getDefaultStorage();
  const result = await storage.snapshot(label);
  return { ok: true, snapshotId: result.id };
}

/**
 * Rollback container (legacy API compatibility)
 */
export async function rollbackContainer(snapshotId: string): Promise<{
  ok: boolean;
  snapshotId: string;
}> {
  const storage = await getDefaultStorage();
  await storage.rollback(snapshotId);
  return { ok: true, snapshotId };
}

/**
 * Get container stats (legacy API compatibility)
 */
export async function getContainerStats(): Promise<{
  ok: boolean;
  stats: {
    totalRecords: number;
    containerSizeBytes: number;
    walSizeBytes: number;
    snapshotCount: number;
    checksum: string;
  };
}> {
  const storage = await getDefaultStorage();
  const stats = await storage.getStats();
  return {
    ok: true,
    stats: {
      totalRecords: stats.totalRecords,
      containerSizeBytes: stats.containerSizeBytes,
      walSizeBytes: stats.walSizeBytes,
      snapshotCount: stats.snapshotCount,
      checksum: stats.checksum,
    },
  };
}

/**
 * Read all payloads (legacy API compatibility)
 */
export async function readAllPayloads(): Promise<{
  ok: boolean;
  payloads: Array<{ key: string; value: string }>;
}> {
  const storage = await getDefaultStorage();
  const keys = await storage.listKeys();
  const payloads = [];

  for (const key of keys) {
    const result = await storage.recoverData(key);
    if (result) {
      payloads.push({ key: result.clave, value: result.dato });
    }
  }

  return { ok: true, payloads };
}

/**
 * Export bundle (legacy API compatibility)
 */
export async function exportBundle(
  label?: string,
  options?: { includeSnapshots?: boolean; includeWal?: boolean }
): Promise<{ ok: boolean; bundleId: string }> {
  const storage = await getDefaultStorage();
  const result = await storage.exportBundle(label);
  return { ok: true, bundleId: result.id };
}

/**
 * Import bundle (legacy API compatibility)
 */
export async function importBundle(bundleId: string): Promise<{
  ok: boolean;
  bundleId: string;
}> {
  const storage = await getDefaultStorage();
  await storage.importBundle(bundleId);
  return { ok: true, bundleId };
}

/**
 * Get network state (legacy API compatibility)
 */
export async function getNetworkState(): Promise<{
  ok: boolean;
  state: {
    nodeId: string;
    peers: string[];
    lastSync: string | null;
  };
}> {
  return {
    ok: true,
    state: {
      nodeId: "local",
      peers: [],
      lastSync: null,
    },
  };
}

/**
 * Export network record (legacy API compatibility)
 */
export async function exportNetworkRecord(key: string): Promise<{
  ok: boolean;
  record: string;
}> {
  const storage = await getDefaultStorage();
  const result = await storage.recoverData(key);
  if (!result) {
    return { ok: false, record: "{}" };
  }
  return { ok: true, record: JSON.stringify(result) };
}

/**
 * Import network record (legacy API compatibility)
 */
export async function importNetworkRecord(params: {
  key: string;
  payload: string;
  checksum: string;
  networkSignature?: string;
  networkKeyId?: string;
  sourceNodeId?: string;
  updatedAt?: string;
  force?: boolean;
}): Promise<{
  ok: boolean;
  key?: string;
  error?: string;
}> {
  const storage = await getDefaultStorage();
  
  // Verify checksum
  const expectedChecksum = createHash("sha256").update(params.payload).digest("hex");
  if (params.checksum !== expectedChecksum && !params.force) {
    return { ok: false, error: "Checksum mismatch" };
  }

  try {
    await storage.inject(params.key, params.payload);
    return { ok: true, key: params.key };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Import failed" };
  }
}

/**
 * Compare network state (legacy API compatibility)
 */
export async function compareNetworkState(remoteState: {
  nodeId: string;
  peers: string[];
  lastSync: string | null;
}): Promise<{
  ok: boolean;
  diff: {
    missing: string[];
    extra: string[];
    conflicts: string[];
  };
}> {
  return {
    ok: true,
    diff: { missing: [], extra: [], conflicts: [] },
  };
}
