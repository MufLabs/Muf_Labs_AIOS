// ─── T-Bit Key-Value Store ───────────────────────────────────────────
// Simple persistent key-value store for T-Bit containers
// Uses the container's WAL + metadata for atomic operations

import path from "path";
import { TBitStorageService, TBitStorageConfig } from "./TBitStorageService.js";
import { normalizeTBitKey } from "./textEncoding.js";
import { getTBitSpacePaths, normalizeTBitSpaceId } from "./tbitRuntimePaths.js";
import { resolveHmacSecret } from "./hmacSecret.js";
import { createHash } from "crypto";

/**
 * Options for KV value operations
 */
export interface KvValueOptions {
  /** Time-to-live in milliseconds (optional) */
  ttl?: number;
  /** Optional type tag for the value */
  type?: string;
}

/**
 * Internal KV entry structure
 */
interface KvEntry {
  value: unknown;
  type?: string;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Create default TBitStorageConfig for KV operations
 */
async function createKvStorageConfig(): Promise<TBitStorageConfig> {
  const spaceId = normalizeTBitSpaceId("kv-store");
  const paths = getTBitSpacePaths(spaceId);

  const [hmacKeyId, hmacSecret] = await resolveHmacSecret();

  const config: TBitStorageConfig = {
    name: "kv-store",
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

  return config;
}

/**
 * Get a singleton KV storage instance
 */
let kvStoragePromise: Promise<TBitStorageService> | null = null;

async function getKvStorage(): Promise<TBitStorageService> {
  if (!kvStoragePromise) {
    kvStoragePromise = (async () => {
      const config = await createKvStorageConfig();
      const storage = new TBitStorageService(config);
      await storage.recover();
      return storage;
    })();
  }
  return kvStoragePromise;
}

/**
 * Get a KV value by key
 * @param key - The key to retrieve
 * @returns The value or null if not found/expired
 */
export async function getKvValue(key: string): Promise<unknown | null> {
  const storage = await getKvStorage();
  return getKvValueInternal(storage, key);
}

async function getKvValueInternal(
  storage: TBitStorageService,
  key: string
): Promise<unknown | null> {
  const normalizedKey = normalizeTBitKey(key);

  try {
    const result = await storage.recoverData(`kv:${normalizedKey}`);
    if (!result || !result.dato) return null;

    const parsed = JSON.parse(result.dato) as KvEntry;

    // Check expiration
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      await deleteKvValueInternal(storage, key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

/**
 * Set a KV value
 * @param key - The key to set
 * @param value - The value to store (must be JSON-serializable)
 * @param options - Optional TTL and type
 */
export async function setKvValue(
  key: string,
  value: unknown,
  options: KvValueOptions = {}
): Promise<void> {
  const storage = await getKvStorage();
  return setKvValueInternal(storage, key, value, options);
}

async function setKvValueInternal(
  storage: TBitStorageService,
  key: string,
  value: unknown,
  options: KvValueOptions = {}
): Promise<void> {
  const normalizedKey = normalizeTBitKey(key);

  const entry: KvEntry = {
    value,
    type: options.type,
    createdAt: new Date().toISOString(),
    expiresAt: options.ttl
      ? new Date(Date.now() + options.ttl).toISOString()
      : undefined,
  };

  await storage.inject(`kv:${normalizedKey}`, JSON.stringify(entry));
}

/**
 * Delete a KV value
 * @param key - The key to delete
 */
export async function deleteKvValue(key: string): Promise<void> {
  const storage = await getKvStorage();
  return deleteKvValueInternal(storage, key);
}

async function deleteKvValueInternal(
  storage: TBitStorageService,
  key: string
): Promise<void> {
  const normalizedKey = normalizeTBitKey(key);
  await storage.collapse(`kv:${normalizedKey}`);
}

/**
 * List KV keys with optional prefix filter
 * @param prefix - Optional prefix to filter keys
 * @param limit - Optional maximum number of keys to return
 * @returns Array of keys
 */
export async function listKvKeys(prefix?: string, limit?: number): Promise<string[]> {
  const storage = await getKvStorage();
  const keys = await storage.listKeys();

  const filteredKeys: string[] = [];

  for (const key of keys) {
    if (key.startsWith("kv:")) {
      const actualKey = key.slice(3); // Remove "kv:" prefix

      if (!prefix || actualKey.startsWith(prefix)) {
        // Check if not expired
        const value = await getKvValueInternal(storage, actualKey);
        if (value !== null) {
          filteredKeys.push(actualKey);
        }
      }
    }
  }

  if (limit && filteredKeys.length > limit) {
    return filteredKeys.slice(0, limit);
  }

  return filteredKeys;
}

/**
 * Get KV store statistics
 * @returns Statistics object
 */
export async function getKvStats(): Promise<{
  totalKeys: number;
  expiredKeys: number;
  totalSizeBytes: number;
}> {
  const storage = await getKvStorage();
  const keys = await storage.listKeys();

  let totalKeys = 0;
  let expiredKeys = 0;
  let totalSizeBytes = 0;

  const now = new Date();

  for (const key of keys) {
    if (key.startsWith("kv:")) {
      totalKeys++;

      try {
        const result = await storage.recoverData(key);
        if (result && result.dato) {
          totalSizeBytes += Buffer.byteLength(result.dato, "utf8");
          const entry = JSON.parse(result.dato) as KvEntry;
          if (entry.expiresAt && new Date(entry.expiresAt) < now) {
            expiredKeys++;
          }
        }
      } catch {
        // Invalid entry, count as potentially expired
        expiredKeys++;
      }
    }
}

  return {
    totalKeys,
    expiredKeys,
    totalSizeBytes,
  };
}

