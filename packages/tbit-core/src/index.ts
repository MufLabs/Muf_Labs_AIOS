// ─── T-Bit Core Engine ───────────────────────────────────────────
export { TBitContainer, TBitOffsets, TBitProjection } from "./TBitFileSystem";
export {
  TBitStorageService,
  TBitMetadataEntry,
  TBitMetadata,
  TBitWalState,
  TBitWalRecord,
  TBitBatchWriteInput,
  TBitBatchCollapseResult,
  TBitStorageConfig,
} from "./TBitStorageService";
export { AllocationMap, AllocationRange } from "./AllocationMap";

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
} from "./EncryptionKeyManager";
export { resolveHmacSecret } from "./hmacSecret";
export {
  normalizeTBitKey,
  normalizeUnicodeText,
} from "./textEncoding";
export {
  obtenerContextoTemporalSistema,
  obtenerPromptTemporalSistema,
  construirMemoriaSemantica,
  inferirClaveConsulta,
  resolverFechaRelativa,
  TemporalContext,
  SemanticMemory,
} from "./temporalSemantics";

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
} from "./memoryCore";

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
} from "./memoryCoreCompat";

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
} from "./queryIndex";
export {
  SemanticIndexEntry,
  getSemanticIndexStats,
  rebuildSemanticIndex,
  searchSemanticIndex,
} from "./semanticIndex";

// ─── AI Permissions ──────────────────────────────────────────────
export {
  getAiPermissionsPolicy,
  updateAiPermissionsPolicy,
  assertAiPermission,
  AiPermissionsPolicy,
  AiPermissionAction,
  AiPermissionDecision,
} from "./aiPermissions";

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
} from "./assetManager";

// ─── Asset Manager API Compatibility Layer ─────────────────────────────
export {
  listAssetsCompat,
  getAssetStatsCompat,
  registerAssetCompat,
  deleteAssetCompat,
} from "./assetManagerCompat";

// ─── Container Health ────────────────────────────────────────────
export {
  getContainerHealthReport,
  TBitContainerHealth,
  TBitHealthReport,
} from "./containerHealth";
export {
  reconcileContainerHealth,
} from "./healthReconciliation";

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
} from "./tbitRuntimePaths";

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
} from "./markdownBridge";

// ─── Markdown Bridge API Compatibility Layer ─────────────────────────────
export {
  importMarkdownDocumentCompat,
  parseMarkdownDocumentCompat,
  listMarkdownDocumentsCompat,
  deleteMarkdownDocumentCompat,
  reconstructMarkdownDocumentCompat,
  purgeOrphanMarkdownChunksCompat,
} from "./markdownBridgeCompat";

// ─── Binary Asset Bridge ─────────────────────────────────────────
export {
  importBinaryAsset,
  reconstructBinaryAsset,
  deleteBinaryAsset,
  BinaryAssetImportRequest,
  BinaryAssetImportResult,
  BinaryAssetReconstructResult,
} from "./binaryAssetBridge";

// ─── Binary Asset Bridge API Compatibility Layer ─────────────────────────────
export {
  importBinaryAssetCompat,
  reconstructBinaryAssetCompat,
  deleteBinaryAssetCompat,
} from "./binaryAssetBridgeCompat";

// ─── Universal Document Bridge ───────────────────────────────────
export {
  importUniversalDocument,
  UniversalDocumentImportRequest,
  UniversalDocumentImportResult,
} from "./universalDocumentBridge";

// ─── Universal Document Bridge API Compatibility Layer ─────────────────────────────
export {
  importUniversalDocumentCompat,
  answerDocumentQuestionCompat,
} from "./universalDocumentBridgeCompat";

// ─── Semantic Compression ────────────────────────────────────────
export {
  compressSemanticGravity,
} from "./semanticCompression";

// ─── Guardian Observer ───────────────────────────────────────────
export {
  observeGuardian,
} from "./guardianObserver";

// ─── Web Research ────────────────────────────────────────────────
export {
  isWebResearchIntent,
  extractFirstUrlFromText,
  researchWebPage,
  buildWebResearchPrompt,
} from "./webResearch";

// ─── Document QA ─────────────────────────────────────────────────
export {
  answerDocumentQuestion,
} from "./documentQa";

// ─── Code Graph Extractor ────────────────────────────────────────
export {
  analyzeSourceCode,
  summarizeCodeGraph,
  isSourceCodeFile,
  buildCodeMarkdownDocument,
  CodeGraphAnalysis,
  CodeGraphSummary,
} from "./codeGraphExtractor";

// ─── KV Store ──────────────────────────────────────────────────────
export {
  getKvValue,
  setKvValue,
  deleteKvValue,
  listKvKeys,
  getKvStats,
  KvValueOptions,
} from "./kvStore";

// ─── Document Extractors ─────────────────────────────────────────
export {
  extractOfficeDocument,
  ExtractedOfficeDocument,
} from "./documentExtractors";

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
} from "./apiCompat";
