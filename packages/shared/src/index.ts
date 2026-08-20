export {
  type TBitSpacePaths,
  normalizeTBitSpaceId,
  getTBitSpacesRoot,
  getTBitSpacePaths,
  setActiveTBitDataDir,
  getActiveTBitDataDir,
  resolveActiveTBitDataPath,
  normalizeTBitVaultRoot,
  setActiveTBitSpacesRoot,
  type TBitSpaceManifest,
  createSpaceManifest,
  listSpaceManifests,
} from "./tbitRuntimePaths.js";

export {
  type VaultContext,
  type VaultProviderConfig,
  type VaultCapability,
  type VaultOpenedPayload,
  type VaultClosedPayload,
  type VaultSwitchedPayload,
  VAULT_EVENTS,
} from "./vaultContext.js";

