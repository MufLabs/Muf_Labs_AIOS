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
  getEncryptionKeyById,
  getEncryptionKeyRing,
  getEncryptionKeyStatus,
  EncryptionKeyMaterial,
} from "./EncryptionKeyManager";
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

// ─── Query & Semantic Index ──────────────────────────────────────
export {
  QueryIndexEntry,
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
  TBitSpacePaths,
  getTBitSpacePaths,
  getTBitSpacesRoot,
  normalizeTBitVaultRoot,
  normalizeTBitSpaceId,
  setActiveTBitDataDir,
  setActiveTBitSpacesRoot,
  resolveActiveTBitDataPath,
  getActiveTBitDataDir,
} from "./tbitRuntimePaths";

// ─── Markdown Bridge ─────────────────────────────────────────────
export {
  MarkdownImportResult,
  importMarkdownDocument,
  parseMarkdownDocument,
  reconstructMarkdownDocument,
  listMarkdownDocuments,
  deleteMarkdownDocument,
  purgeOrphanMarkdownChunks,
} from "./markdownBridge";

// ─── Binary Asset Bridge ─────────────────────────────────────────
export {
  importBinaryAsset,
  reconstructBinaryAsset,
  deleteBinaryAsset,
} from "./binaryAssetBridge";

// ─── Universal Document Bridge ───────────────────────────────────
export {
  importUniversalDocument,
} from "./universalDocumentBridge";

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

// ─── Document Extractors ─────────────────────────────────────────
export {
  extractOfficeDocument,
  ExtractedOfficeDocument,
} from "./documentExtractors";