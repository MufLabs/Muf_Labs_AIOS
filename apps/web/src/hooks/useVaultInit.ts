import { useEffect, useState, useCallback } from "react";
import { useVaultPicker } from "./useVaultPicker";
import { tbitVaultClient } from "../api/tbit/tbitVaultClient";
import type { VaultConfig, VaultStatusResponse } from "../types/vault";

export type VaultInitState = "loading" | "onboarding" | "ready" | "error";

export interface UseVaultInitResult {
  /** Current initialization state */
  state: VaultInitState;
  /** Loaded vault configuration (null if not configured or loading) */
  vaultConfig: VaultConfig | null;
  /** Vault status from API (null if not checked) */
  vaultStatus: VaultStatusResponse | null;
  /** Error message if state is 'error' */
  error: string | null;
  /** Retry initialization */
  retry: () => Promise<void>;
  /** Manually trigger onboarding (e.g., user wants to reconfigure vault) */
  triggerOnboarding: () => void;
}

/**
 * Hook managing the vault initialization flow on application startup.
 * 
 * Flow:
 * 1. Load vault config from IndexedDB
 * 2. If no config → state = 'onboarding'
 * 3. If config exists → restore File System Access permission
 * 4. If permission restored → verify vault via API
 * 5. If vault accessible → state = 'ready'
 * 6. If vault inaccessible → state = 'onboarding' (with error)
 */
export function useVaultInit(): UseVaultInitResult {
  const { loadVaultConfig, restorePermission, clearVaultConfig } = useVaultPicker();
  
  const [state, setState] = useState<VaultInitState>("loading");
  const [vaultConfig, setVaultConfig] = useState<VaultConfig | null>(null);
  const [vaultStatus, setVaultStatus] = useState<VaultStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    setState("loading");
    setError(null);
    setVaultStatus(null);

    try {
      // 1. Load vault config from IndexedDB
      const config = await loadVaultConfig();
      
      if (!config) {
        // No vault configured → show onboarding
        setState("onboarding");
        setVaultConfig(null);
        return;
      }

      // 2. Restore permission for the saved directory handle
      const permissionRestored = await restorePermission(config);
      
      if (!permissionRestored) {
        // Permission denied or handle stale → clear config and show onboarding
        await clearVaultConfig();
        setState("onboarding");
        setVaultConfig(null);
        setError("Permission to access vault folder was revoked. Please select the folder again.");
        return;
      }

      // 3. Verify vault is accessible via API
      const status = await tbitVaultClient.getVaultStatus();
      
      if (status.initialized && status.kernelReady) {
        // Vault is ready → mount app
        setVaultConfig(config);
        setVaultStatus(status);
        setState("ready");
      } else {
        // Vault exists but not fully initialized → show onboarding
        setState("onboarding");
        setVaultConfig(config);
        setError("Vault found but not fully initialized. Please complete setup.");
      }
    } catch (e) {
      // Network error or API unreachable → show onboarding with error
      setState("onboarding");
      setVaultConfig(null);
      setError(e instanceof Error ? e.message : "Failed to verify vault. Check your connection.");
    }
  }, [loadVaultConfig, restorePermission, clearVaultConfig]);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      await initialize();
      if (!cancelled) {
        // State already set by initialize()
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [initialize]);

  const retry = useCallback(async () => {
    await initialize();
  }, [initialize]);

  const triggerOnboarding = useCallback(() => {
    setState("onboarding");
    setVaultConfig(null);
    setVaultStatus(null);
    setError(null);
  }, []);

  return {
    state,
    vaultConfig,
    vaultStatus,
    error,
    retry,
    triggerOnboarding,
  };
}