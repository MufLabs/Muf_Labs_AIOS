// ─── Markdown Bridge API Compatibility Layer ─────────────────────────────
// Provides backward-compatible function signatures for the API routes
// that expect the old functional API style from @aios/database

import {
  TBitStorageService,
  TBitStorageConfig,
} from "./TBitStorageService";
import { getTBitSpacePaths, normalizeTBitSpaceId } from "./tbitRuntimePaths";
import { resolveHmacSecret } from "./hmacSecret";
import { createHash } from "crypto";
import path from "path";
import {
  importMarkdownDocument,
  parseMarkdownDocument,
  listMarkdownDocuments,
  deleteMarkdownDocument,
  reconstructMarkdownDocument,
  purgeOrphanMarkdownChunks,
  MarkdownImportRequest,
  MarkdownImportResult,
  MarkdownDocumentListItem,
  MarkdownDeleteResult,
  MarkdownPurgeResult,
} from "./markdownBridge";

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
 * Import markdown document (legacy API compatibility - no storage parameter)
 */
export async function importMarkdownDocumentCompat(
  request: MarkdownImportRequest
): Promise<MarkdownImportResult> {
  const storage = await getDefaultStorage();
  return importMarkdownDocument(storage, request);
}

/**
 * Parse markdown document (legacy API compatibility - no storage parameter)
 */
export function parseMarkdownDocumentCompat(request: MarkdownImportRequest) {
  return parseMarkdownDocument(request);
}

/**
 * List markdown documents (legacy API compatibility - no storage parameter)
 */
export async function listMarkdownDocumentsCompat(userId?: string): Promise<MarkdownDocumentListItem[]> {
  return listMarkdownDocuments(userId);
}

/**
 * Delete markdown document (legacy API compatibility - no storage parameter)
 */
export async function deleteMarkdownDocumentCompat(
  manifestKey: string
): Promise<MarkdownDeleteResult> {
  const storage = await getDefaultStorage();
  return deleteMarkdownDocument(storage, manifestKey);
}

/**
 * Reconstruct markdown document (legacy API compatibility - no storage parameter)
 */
export async function reconstructMarkdownDocumentCompat(
  manifestKey: string
): Promise<{
  key: string;
  content: string;
  chunkCount: number;
}> {
  const storage = await getDefaultStorage();
  return reconstructMarkdownDocument(storage, manifestKey);
}

/**
 * Purge orphan markdown chunks (legacy API compatibility - no storage parameter)
 */
export async function purgeOrphanMarkdownChunksCompat(
  userId?: string
): Promise<MarkdownPurgeResult> {
  const storage = await getDefaultStorage();
  return purgeOrphanMarkdownChunks(storage, userId);
}