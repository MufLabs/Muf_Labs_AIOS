// Re-export T-Bit runtime paths from @muf/tbit-core to provide a unified API surface
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
} from "@muf/tbit-core";

// Re-export the core text encoding utility
export { normalizeTBitKey, normalizeUnicodeText } from "@muf/tbit-core";