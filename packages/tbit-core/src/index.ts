// ─── T-Bit Core Engine ───────────────────────────────────────────
export { TBitContainer, TBitOffsets, TBitProjection } from "./TBitFileSystem.js";
export {
  TBitStorageService,
  TBitMetadataEntry,
  TBitMetadata,
  TBitWalState,
  TBitWalRecord,
  TBitBatchWriteInput,
  TBitBatchCollapseResult,
  TBitStorageConfig,
} from "./TBitStorageService.js";
export { AllocationMap, AllocationRange } from "./AllocationMap.js";

// ─── Security & Encoding ─────────────────────────────────────────
export {
  getActiveEncryptionKey,
  getActiveEncryptionKeyAsync,
  getEncryptionKeyById,
  getEncryptionKeyRing,
  getEncryptionKeyStatus,
  generateEncryptionKey,
  activateStoredKey,
  isEncryptionConfigured,
  EncryptionKeyMaterial,
} from "./EncryptionKeyManager.js";
export { resolveHmacSecret } from "./hmacSecret.js";
export {
  normalizeTBitKey,
  normalizeUnicodeText,
} from "./textEncoding.js";
export {
  obtenerContextoTemporalSistema,
  obtenerPromptTemporalSistema,
  construirMemoriaSemantica,
  inferirClaveConsulta,
  resolverFechaRelativa,
  TemporalContext,
  SemanticMemory,
} from "./temporalSemantics.js";

// ─── Memory Core ─────────────────────────────────────────────────
export {
  MemoryCoreRememberRequest,
  MemoryCoreRecord,
  MemoryCoreContextResult,
  MemoryGraphNode,
  MemoryGraphLink,
  MemoryGraph,
  rememberMemory,
  recallMemory,
  getMemoryContext,
  getMemoryLinks,
  getMemoryGraph,
  deleteMemoryRecord,
  deleteMemoryRecordsBatch,
  rememberMemoryBatch,
} from "./memoryCore.js";

// ─── Memory Core API Compatibility Layer ─────────────────────────────
export {
  rememberMemoryCompat,
  rememberMemoryBatchCompat,
  recallMemoryCompat,
  getMemoryContextCompat,
  getMemoryLinksCompat,
  getMemoryGraphCompat,
  deleteMemoryRecordCompat,
  deleteMemoryRecordsBatchCompat,
} from "./memoryCoreCompat.js";

// ─── Query & Semantic Index ──────────────────────────────────────
export {
  QueryIndexEntry,
  QuerySearchRequest,
  QuerySearchResult,
  getQueryIndex,
  getQueryIndexStats,
  rebuildQueryIndex,
  searchQueryIndex,
  syncQueryIndexIncremental,
} from "./queryIndex.js";
export {
  SemanticIndexEntry,
  getSemanticIndexStats,
  rebuildSemanticIndex,
  searchSemanticIndex,
} from "./semanticIndex.js";

// ─── AI Permissions ──────────────────────────────────────────────
export {
  getAiPermissionsPolicy,
  updateAiPermissionsPolicy,
  assertAiPermission,
  AiPermissionsPolicy,
  AiPermissionAction,
  AiPermissionDecision,
} from "./aiPermissions.js";

// ─── Asset Manager ───────────────────────────────────────────────
export {
  listAssets,
  getAssetStats,
  registerAsset,
  deleteAsset,
  TBitAssetRecord,
  TBitAssetStatus,
  TBitAssetIndex,
  RegisterAssetRequest,
  DeleteAssetResult,
} from "./assetManager.js";

// ─── Asset Manager API Compatibility Layer ─────────────────────────────
export {
  listAssetsCompat,
  getAssetStatsCompat,
  registerAssetCompat,
  deleteAssetCompat,
} from "./assetManagerCompat.js";

// ─── Container Health ────────────────────────────────────────────
export {
  getContainerHealthReport,
  TBitContainerHealth,
  TBitHealthReport,
} from "./containerHealth.js";
export {
  reconcileContainerHealth,
} from "./healthReconciliation.js";

// ─── Runtime Paths ───────────────────────────────────────────────
export {
  type TBitSpacePaths,
  type TBitSpaceManifest,
  getTBitSpacePaths,
  getTBitSpacesRoot,
  normalizeTBitVaultRoot,
  normalizeTBitSpaceId,
  setActiveTBitDataDir,
  setActiveTBitSpacesRoot,
  resolveActiveTBitDataPath,
  getActiveTBitDataDir,
  createSpaceManifest,
  listSpaceManifests,
} from "./tbitRuntimePaths.js";

// ─── Markdown Bridge ─────────────────────────────────────────────
export {
  MarkdownImportResult,
  MarkdownImportRequest,
  importMarkdownDocument,
  parseMarkdownDocument,
  reconstructMarkdownDocument,
  listMarkdownDocuments,
  deleteMarkdownDocument,
  purgeOrphanMarkdownChunks,
} from "./markdownBridge.js";

// ─── Markdown Bridge API Compatibility Layer ─────────────────────────────
export {
  importMarkdownDocumentCompat,
  parseMarkdownDocumentCompat,
  listMarkdownDocumentsCompat,
  deleteMarkdownDocumentCompat,
  reconstructMarkdownDocumentCompat,
  purgeOrphanMarkdownChunksCompat,
} from "./markdownBridgeCompat.js";

// ─── Binary Asset Bridge ─────────────────────────────────────────
export {
  importBinaryAsset,
  reconstructBinaryAsset,
  deleteBinaryAsset,
  BinaryAssetImportRequest,
  BinaryAssetImportResult,
  BinaryAssetReconstructResult,
} from "./binaryAssetBridge.js";

// ─── Binary Asset Bridge API Compatibility Layer ─────────────────────────────
export {
  importBinaryAssetCompat,
  reconstructBinaryAssetCompat,
  deleteBinaryAssetCompat,
} from "./binaryAssetBridgeCompat.js";

// ─── Universal Document Bridge ───────────────────────────────────
export {
  importUniversalDocument,
  UniversalDocumentImportRequest,
  UniversalDocumentImportResult,
} from "./universalDocumentBridge.js";

// ─── Universal Document Bridge API Compatibility Layer ─────────────────────────────
export {
  importUniversalDocumentCompat,
  answerDocumentQuestionCompat,
} from "./universalDocumentBridgeCompat.js";

// ─── Semantic Compression ────────────────────────────────────────
export {
  compressSemanticGravity,
} from "./semanticCompression.js";

// ─── Guardian Observer ───────────────────────────────────────────
export {
  observeGuardian,
} from "./guardianObserver.js";

// ─── Web Research ────────────────────────────────────────────────
export {
  isWebResearchIntent,
  extractFirstUrlFromText,
  researchWebPage,
  buildWebResearchPrompt,
} from "./webResearch.js";

// ─── Document QA ─────────────────────────────────────────────────
export {
  answerDocumentQuestion,
} from "./documentQa.js";

// ─── Code Graph Extractor ────────────────────────────────────────
export {
  analyzeSourceCode,
  summarizeCodeGraph,
  isSourceCodeFile,
  buildCodeMarkdownDocument,
  CodeGraphAnalysis,
  CodeGraphSummary,
} from "./codeGraphExtractor.js";

// ─── KV Store ──────────────────────────────────────────────────────
export {
  getKvValue,
  setKvValue,
  deleteKvValue,
  listKvKeys,
  getKvStats,
  KvValueOptions,
} from "./kvStore.js";

// ─── Document Extractors ─────────────────────────────────────────
export {
  extractOfficeDocument,
  ExtractedOfficeDocument,
} from "./documentExtractors.js";

// ─── API Compatibility Layer ────────────────────────────────────────
export {
  injectMemory,
  injectManyMemories,
  recoverData,
  collapseMemory,
  collapseManyMemories,
  snapshotContainer,
  rollbackContainer,
  getContainerStats,
  readAllPayloads,
  exportBundle,
  importBundle,
  getNetworkState,
  exportNetworkRecord,
  importNetworkRecord,
  compareNetworkState,
} from "./apiCompat.js";

