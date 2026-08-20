/**
 * @aios/database - Barrel exports
 *
 * Re-exports all public API from sub-modules of the @aios/database package.
 */

// Core utilities
export { normalizeUnicodeText, normalizeTBitKey } from "./core/textEncoding.js";

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
} from "./core/RuntimePaths.js";

// Storage engine
export { TBitContainer } from "./storage/TBitContainer.js";
export type { TBitOffsets, TBitProjection } from "./storage/TBitContainer.js";
export { TBitStorageService } from "./storage/TBitStorageService.js";
export type {
  TBitMetadataEntry,
  TBitMetadata,
  TBitWalState,
  TBitWalRecord,
  TBitBatchWriteInput,
  TBitBatchCollapseResult,
  TBitStorageConfig,
} from "./storage/TBitStorageService.js";
export { AllocationMap } from "./storage/AllocationMap.js";
export type { AllocationRange, AllocationRegion } from "./storage/AllocationMap.js";

// Security
export {
  getActiveEncryptionKey,
  getEncryptionKeyRing,
  getEncryptionKeyById,
  getEncryptionKeyStatus,
} from "./security/EncryptionKeyManager.js";
export type { EncryptionKeyMaterial } from "./security/EncryptionKeyManager.js";

// Query index
export {
  rebuildQueryIndex,
  syncQueryIndexIncremental,
  getQueryIndex,
  searchQueryIndex,
  getQueryIndexStats,
} from "./indexing/QueryIndex.js";
export type {
  QueryIndexEntry,
  TBitQueryIndex,
  QuerySearchRequest,
  QuerySearchResult,
} from "./indexing/QueryIndex.js";

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
} from "./memory/MemoryCore.js";
export type {
  MemoryCoreRememberRequest,
  MemoryCoreRecord,
  MemoryCoreContextResult,
  MemoryGraphNode,
  MemoryGraphLink,
  MemoryGraph,
} from "./memory/MemoryCore.js";

// Asset manager
export {
  registerAsset,
    listAssets,
  deleteAsset,
  getAssetStats,
} from "./assets/AssetManager.js";
// Bridges
export * from "./bridges/MarkdownBridge.js";
export * from "./bridges/BinaryAssetBridge.js";
export * from "./bridges/UniversalDocumentBridge.js";
export * from "./bridges/DocumentExtractors.js";
export * from "./bridges/CodeGraphExtractor.js";

// Semantic index
export {
  type SemanticIndexEntry,
  type TBitSemanticIndex,
  type SemanticSearchRequest,
  type SemanticSearchResult,
  rebuildSemanticIndex,
  getSemanticIndex,
  searchSemanticIndex,
  getSemanticIndexStats,
} from "./indexing/SemanticIndex.js";

export type {
  TBitAssetStatus,
  TBitAssetRecord,
  TBitAssetIndex,
  RegisterAssetRequest,
  DeleteAssetResult,
} from "./assets/AssetManager.js";

// Semantic compression (canonical)
export {
  type CompressionState,
  type SemanticCompressionRequest,
  type SemanticCompressionReport,
  compressSemanticGravity,
} from "./SemanticCompression.js";
