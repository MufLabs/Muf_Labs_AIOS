/**
 * @aios/database - Barrel exports
 *
 * Re-exports all public API from sub-modules of the @aios/database package.
 */

// Core utilities
export { normalizeUnicodeText, normalizeTBitKey } from "./core/textEncoding";

// Runtime paths
export {
  getTBitDataDir,
  resolveActiveTBitDataPath,
  resolveContainerPath,
  resolveMetadataPath,
  resolveWalPath,
  resolveSnapshotsDir,
  resolveReplicasDir,
  resolveExportsDir,
  resolveLockPath,
} from "./core/RuntimePaths";

// Storage engine
export { TBitContainer } from "./storage/TBitContainer";
export type { TBitOffsets, TBitProjection } from "./storage/TBitContainer";
export { TBitStorageService } from "./storage/TBitStorageService";
export type {
  TBitMetadataEntry,
  TBitMetadata,
  TBitWalState,
  TBitWalRecord,
  TBitBatchWriteInput,
  TBitBatchCollapseResult,
  TBitStorageConfig,
} from "./storage/TBitStorageService";
export { AllocationMap } from "./storage/AllocationMap";
export type { AllocationRange, AllocationRegion } from "./storage/AllocationMap";

// Security
export {
  getActiveEncryptionKey,
  getEncryptionKeyRing,
  getEncryptionKeyById,
  getEncryptionKeyStatus,
} from "./security/EncryptionKeyManager";
export type { EncryptionKeyMaterial } from "./security/EncryptionKeyManager";

// Query index
export {
  rebuildQueryIndex,
  syncQueryIndexIncremental,
  getQueryIndex,
  searchQueryIndex,
  getQueryIndexStats,
} from "./indexing/QueryIndex";
export type {
  QueryIndexEntry,
  TBitQueryIndex,
  QuerySearchRequest,
  QuerySearchResult,
} from "./indexing/QueryIndex";

// Memory core
export {
  rememberMemory,
  rememberMemoryBatch,
  indexExternalMemoryRecord,
  removeMemoryIndexRecord,
  recallMemory,
  getMemoryContext,
  getMemoryLinks,
  deleteMemoryRecord,
  deleteMemoryRecordsBatch,
  getMemoryGraph,
} from "./memory/MemoryCore";
export type {
  MemoryCoreRememberRequest,
  MemoryCoreRecord,
  MemoryCoreContextResult,
  MemoryGraphNode,
  MemoryGraphLink,
  MemoryGraph,
} from "./memory/MemoryCore";

// Asset manager
export {
  registerAsset,
    listAssets,
  deleteAsset,
  getAssetStats,
} from "./assets/AssetManager";
// Bridges
export * from "./bridges/MarkdownBridge";
export * from "./bridges/BinaryAssetBridge";
export * from "./bridges/UniversalDocumentBridge";
export * from "./bridges/DocumentExtractors";
export * from "./bridges/CodeGraphExtractor";

// Semantic index
export * from "./indexing/SemanticIndex";

export type {
  TBitAssetStatus,
  TBitAssetRecord,
  TBitAssetIndex,
  RegisterAssetRequest,
  DeleteAssetResult,
} from "./assets/AssetManager";
export * from "./SemanticCompression";
export * from "./EncryptionKeyManager";
export * from "./AllocationMap";
