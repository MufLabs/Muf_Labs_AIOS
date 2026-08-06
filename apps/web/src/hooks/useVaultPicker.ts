import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { VaultConfig, VaultManualConfig } from "../types/vault";
import { isFileSystemAccessSupported } from "../types/vault";

// ──────────────────────────────────────────────────────────────
// Type Augmentation for File System Access API (permission methods)
// ──────────────────────────────────────────────────────────────

interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite";
}

// Extend the global FileSystemDirectoryHandle interface with permission methods
// This uses declaration merging to add the missing methods
declare global {
  interface FileSystemDirectoryHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    readonly name: string;
  }
}

// ──────────────────────────────────────────────────────────────
// IndexedDB Schema
// ──────────────────────────────────────────────────────────────

interface VaultDB extends DBSchema {
  vaults: {
    key: string;
    value: VaultConfig;
    indexes: { "by-created": string };
  };
}

const DB_NAME = "aios-vault-config";
const DB_VERSION = 1;
const STORE_NAME = "vaults";

let dbPromise: Promise<IDBPDatabase<VaultDB>> | null = null;

function getDB(): Promise<IDBPDatabase<VaultDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VaultDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-created", "createdAt");
      },
    });
  }
  return dbPromise!;
}

// ──────────────────────────────────────────────────────────────
// Vault Picker Hook
// ──────────────────────────────────────────────────────────────

export interface UseVaultPickerResult {
  /** Whether File System Access API is supported */
  isSupported: boolean;
  /** Pick a vault folder using native OS dialog */
  pickVaultFolder: (label?: string) => Promise<VaultConfig | null>;
  /** Load saved vault config from IndexedDB */
  loadVaultConfig: () => Promise<VaultConfig | null>;
  /** Save vault config to IndexedDB */
  saveVaultConfig: (config: VaultConfig) => Promise<void>;
  /** Clear saved vault config */
  clearVaultConfig: () => Promise<void>;
  /** Restore permission for saved FileSystemDirectoryHandle */
  restorePermission: (config: VaultConfig) => Promise<boolean>;
}

/**
 * Hook for vault folder selection and persistence using
 * File System Access API + IndexedDB.
 */
export function useVaultPicker(): UseVaultPickerResult {
  const isSupported = isFileSystemAccessSupported();

  /**
   * Check if we have permission to access the directory handle
   */
  async function checkPermission(handle: FileSystemDirectoryHandle, mode: "read" | "readwrite" = "readwrite"): Promise<boolean> {
    try {
      const permission = await handle.queryPermission({ mode });
      return permission === "granted";
    } catch {
      return false;
    }
  }

  /**
   * Request permission for the directory handle
   */
  async function requestPermission(handle: FileSystemDirectoryHandle, mode: "read" | "readwrite" = "readwrite"): Promise<boolean> {
    try {
      const permission = await handle.requestPermission({ mode });
      return permission === "granted";
    } catch {
      return false;
    }
  }

  /**
   * Pick a vault folder using native OS directory picker
   */
  async function pickVaultFolder(label?: string): Promise<VaultConfig | null> {
    if (!isSupported) {
      throw new Error("File System Access API not supported in this browser");
    }

    try {
      // @ts-expect-error - showDirectoryPicker is available when isSupported is true
      const handle = await window.showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
      });

      // Verify we have permission
      const hasPermission = await checkPermission(handle);
      if (!hasPermission) {
        const granted = await requestPermission(handle);
        if (!granted) {
          throw new Error("Permission denied for selected folder");
        }
      }

      // Get a readable path for display
      const rootPath = getDisplayPath(handle);

      const config: VaultConfig = {
        id: crypto.randomUUID(),
        label: label ?? `AIOS Vault ${new Date().toLocaleDateString()}`,
        rootHandle: handle,
        rootPath,
        spacesRoot: `${rootPath}/spaces`,
        createdAt: new Date().toISOString(),
        schemaVersion: 1,
      };

      await saveVaultConfig(config);
      return config;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // User cancelled the picker
        return null;
      }
      throw error;
    }
  }

  /**
   * Load saved vault config from IndexedDB
   */
  async function loadVaultConfig(): Promise<VaultConfig | null> {
    const db = await getDB();
    const vaults = await db.getAllFromIndex(STORE_NAME, "by-created");
    if (vaults.length === 0) return null;

    // Return most recent vault
    return vaults[vaults.length - 1];
  }

  /**
   * Save vault config to IndexedDB
   * Note: FileSystemDirectoryHandle is stored via idb's special handling
   */
  async function saveVaultConfig(config: VaultConfig): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, config);
  }

  /**
   * Clear saved vault config
   */
  async function clearVaultConfig(): Promise<void> {
    const db = await getDB();
    const vaults = await db.getAll(STORE_NAME);
    for (const vault of vaults) {
      await db.delete(STORE_NAME, vault.id);
    }
  }

  /**
   * Restore permission for a saved FileSystemDirectoryHandle
   * Called on app startup to re-establish access
   */
  async function restorePermission(config: VaultConfig): Promise<boolean> {
    if (!isSupported) return false;

    try {
      const hasPermission = await checkPermission(config.rootHandle);
      if (hasPermission) return true;

      // Permission was revoked, request again
      const granted = await requestPermission(config.rootHandle);
      if (granted) {
        // Update last verified timestamp
        config.lastVerifiedAt = new Date().toISOString();
        await saveVaultConfig(config);
        return true;
      }
      return false;
    } catch {
      // Handle might be stale/invalid
      return false;
    }
  }

  // Helper to get a displayable path from a handle
  function getDisplayPath(handle: FileSystemDirectoryHandle): string {
    // FileSystemDirectoryHandle doesn't expose full path for security
    // We'll use the name and build a reasonable display path
    // In practice, the server will resolve the actual path
    return handle.name ? `/${handle.name}` : "Selected Vault";
  }

  return {
    isSupported,
    pickVaultFolder,
    loadVaultConfig,
    saveVaultConfig,
    clearVaultConfig,
    restorePermission,
  };
}
