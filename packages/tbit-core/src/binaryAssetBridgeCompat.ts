// ─── Binary Asset Bridge API Compatibility Layer ─────────────────────────────
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
  importBinaryAsset,
  reconstructBinaryAsset,
  deleteBinaryAsset,
  BinaryAssetImportRequest,
  BinaryAssetImportResult,
  BinaryAssetReconstructResult,
} from "./binaryAssetBridge.js";

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
 * Import binary asset (legacy API compatibility - no storage parameter)
 */
export async function importBinaryAssetCompat(
  request: BinaryAssetImportRequest
): Promise<BinaryAssetImportResult> {
  const storage = await getDefaultStorage();
  return importBinaryAsset(storage, request);
}

/**
 * Reconstruct binary asset (legacy API compatibility - no storage parameter)
 */
export async function reconstructBinaryAssetCompat(
  rootKey: string
): Promise<BinaryAssetReconstructResult> {
  const storage = await getDefaultStorage();
  return reconstructBinaryAsset(storage, rootKey);
}

/**
 * Delete binary asset (legacy API compatibility - no storage parameter)
 */
export async function deleteBinaryAssetCompat(
  rootOrAssetKey: string
): Promise<{
  assetKey: string;
  rootKey: string;
  deletedKeys: string[];
  collapsedCount: number;
  indexRemovedCount: number;
  warnings: string[];
}> {
  const storage = await getDefaultStorage();
  return deleteBinaryAsset(storage, rootOrAssetKey);
}
