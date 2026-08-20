// ─── Asset Manager API Compatibility Layer ─────────────────────────────
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
  listAssets,
  getAssetStats,
  registerAsset,
  deleteAsset,
  TBitAssetRecord,
  DeleteAssetResult,
  RegisterAssetRequest,
} from "./assetManager.js";

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
 * List assets (legacy API compatibility - no storage parameter needed)
 */
export async function listAssetsCompat(userId?: string): Promise<TBitAssetRecord[]> {
  return listAssets(userId);
}

/**
 * Get asset statistics (legacy API compatibility - no storage parameter needed)
 */
export async function getAssetStatsCompat(userId?: string) {
  return getAssetStats(userId);
}

/**
 * Register asset (legacy API compatibility)
 */
export async function registerAssetCompat(request: RegisterAssetRequest): Promise<TBitAssetRecord> {
  return registerAsset(request);
}

/**
 * Delete asset (legacy API compatibility - wraps with default storage)
 */
export async function deleteAssetCompat(assetKeyOrRootKey: string): Promise<DeleteAssetResult> {
  const storage = await getDefaultStorage();
  return deleteAsset(storage, assetKeyOrRootKey);
}
