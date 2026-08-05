// FileSystemDirectoryHandle is a standard DOM type (File System Access API)
type FileSystemDirectoryHandle = globalThis.FileSystemDirectoryHandle;

/**
 * Vault configuration persisted in IndexedDB (via idb)
 * Contains the FileSystemDirectoryHandle for the user-selected vault root.
 */
export interface VaultConfig {
  /** Unique identifier for this vault configuration */
  id: string;
  /** Human-readable label for the vault */
  label: string;
  /** Serialized FileSystemDirectoryHandle (using idb's special handling) */
  rootHandle: FileSystemDirectoryHandle;
  /** Human-readable path for display purposes */
  rootPath: string;
  /** Path where T-Bit spaces are stored (derived: rootPath + "/spaces") */
  spacesRoot: string;
  /** ISO timestamp when vault was created/configured */
  createdAt: string;
  /** ISO timestamp when vault was last verified accessible */
  lastVerifiedAt?: string;
  /** Schema version for future migrations */
  schemaVersion: 1;
}

/**
 * Request payload for initializing a vault via API
 */
export interface VaultInitRequest {
  /** Server-resolved absolute path to vault root */
  vaultRoot: string;
  /** User identifier */
  userId: string;
  /** Optional label for the primary space */
  label?: string;
  /** Whether to generate a new encryption key */
  generateKey?: boolean;
}

/**
 * Response from vault initialization API
 */
export interface VaultInitResponse {
  /** Vault root path (server-side) */
  vaultRoot: string;
  /** Primary space ID created */
  spaceId: string;
  /** Encryption key ID used */
  encryptionKeyId: string;
  /** Whether Kernel and all providers initialized successfully */
  kernelReady: boolean;
  /** Per-subsystem readiness status */
  subsystems: Record<string, boolean>;
  /** ISO timestamp of initialization */
  initializedAt: string;
}

/**
 * Vault status response from API
 */
export interface VaultStatusResponse {
  /** Whether vault is initialized and accessible */
  initialized: boolean;
  /** Vault root path */
  vaultRoot?: string;
  /** Number of spaces in vault */
  spacesCount: number;
  /** Encryption configuration status */
  encryptionConfigured: boolean;
  /** Kernel readiness */
  kernelReady: boolean;
  /** Subsystem health */
  subsystems: Record<string, boolean>;
  /** Last verification timestamp */
  lastVerifiedAt?: string;
  /** Error message if not initialized */
  error?: string;
}

/**
 * Vault verification request
 */
export interface VaultVerifyRequest {
  /** Vault root path to verify */
  vaultRoot: string;
}

/**
 * Vault verification response
 */
export interface VaultVerifyResponse {
  /** Whether vault is accessible and valid */
  accessible: boolean;
  /** Whether vault has valid structure */
  validStructure: boolean;
  /** Whether encryption is configured */
  encryptionConfigured: boolean;
  /** Space manifests found */
  spaces: Array<{ spaceId: string; label: string; userId: string }>;
  /** Error details if not accessible */
  error?: string;
}

/**
 * Vault configuration response from API
 */
export interface VaultConfigResponse {
  /** Vault root path */
  vaultRoot: string;
  /** Spaces root path */
  spacesRoot: string;
  /** Active encryption key ID */
  encryptionKeyId: string;
  /** List of spaces in vault */
  spaces: Array<{ spaceId: string; label: string; userId: string }>;
}

/**
 * Fallback configuration for browsers without File System Access API
 */
export interface VaultManualConfig {
  /** Manually entered vault root path */
  vaultRoot: string;
  /** User identifier */
  userId: string;
  /** Optional label */
  label?: string;
}

/**
 * Type guard to check if File System Access API is available
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "showDirectoryPicker" in window &&
    typeof (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker === "function"
  );
}