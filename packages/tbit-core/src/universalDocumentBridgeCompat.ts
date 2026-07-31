// ─── Universal Document Bridge API Compatibility Layer ─────────────────────────────
// Provides backward-compatible function signatures for the API routes
// that expect the old functional API style from @aios/database

import {
  TBitStorageService,
  TBitStorageConfig,
} from "./TBitStorageService";
import { getTBitSpacePaths, normalizeTBitSpaceId } from "./tbitRuntimePaths";
import { getActiveEncryptionKeyAsync } from "./EncryptionKeyManager";
import { createHash } from "crypto";
import path from "path";
import {
  importUniversalDocument,
  UniversalDocumentImportRequest,
  UniversalDocumentImportResult,
} from "./universalDocumentBridge";
import {
  answerDocumentQuestion,
  DocumentQuestionRequest,
  DocumentQuestionResult,
} from "./documentQa";

/**
 * Create a default TBitStorageConfig for compatibility functions
 */
async function createDefaultStorage(): Promise<TBitStorageService> {
  const spaceId = normalizeTBitSpaceId("default");
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
 * Import universal document (legacy API compatibility - no storage parameter)
 */
export async function importUniversalDocumentCompat(
  request: UniversalDocumentImportRequest
): Promise<UniversalDocumentImportResult> {
  const storage = await getDefaultStorage();
  return importUniversalDocument(storage, request);
}

/**
 * Answer document question (legacy API compatibility - no storage parameter)
 */
export async function answerDocumentQuestionCompat(
  request: DocumentQuestionRequest
): Promise<DocumentQuestionResult> {
  const storage = await getDefaultStorage();
  return answerDocumentQuestion(storage, request);
}
