// @vitest-environment jsdom

/**
 * Stage 8.3 — useVaultInit Test Suite
 *
 * Verifies every startup branch of the `useVaultInit` hook:
 *   - Initial loading state
 *   - Vault discovery (loadVaultConfig)
 *   - Vault restoration (config found)
 *   - Permission restoration (restorePermission)
 *   - Vault status verification (tbitVaultClient.getVaultStatus)
 *   - Successful startup (state = "ready")
 *   - Startup failure (API throws)
 *   - Retry (retry() invocation)
 *   - Transition to onboarding (missing vault / permission revoked / invalid vault)
 *   - Transition to error (currently not triggered in production; covered implicitly)
 *   - Invalid Vault (status.initialized=false or vaultReady=false)
 *   - Revoked permissions (restorePermission returns false)
 *
 * External collaborators are mocked at the module boundary. All
 * business logic in `useVaultInit` is exercised directly.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useVaultInit } from "./useVaultInit";
import type { VaultConfig, VaultStatusResponse } from "../types/vault";

// ──────────────────────────────────────────────────────────────────────────
// Module mocks (mock fns must be hoisted to be referenced inside vi.mock factories)
// ──────────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  loadVaultConfig: vi.fn(async (): Promise<VaultConfig | null> => null),
  restorePermission: vi.fn(async (_cfg: VaultConfig): Promise<boolean> => true),
  clearVaultConfig: vi.fn(async (): Promise<void> => undefined),
  getVaultStatus: vi.fn(async (): Promise<VaultStatusResponse> => ({} as VaultStatusResponse)),
}));

vi.mock("./useVaultPicker", () => ({
  useVaultPicker: () => ({
    loadVaultConfig: mocks.loadVaultConfig,
    saveVaultConfig: vi.fn(),
    clearVaultConfig: mocks.clearVaultConfig,
    restorePermission: mocks.restorePermission,
    pickVaultFolder: vi.fn(),
    isSupported: true,
  }),
}));

vi.mock("../api/tbit/tbitVaultClient", () => ({
  tbitVaultClient: {
    getVaultStatus: mocks.getVaultStatus,
    initVault: vi.fn(),
    verifyVault: vi.fn(),
    getVaultConfig: vi.fn(),
    bootstrapWithVaultConfig: vi.fn(),
  },
}));

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<VaultConfig> = {}): VaultConfig {
  return {
    id: overrides.id ?? "vault-1",
    label: overrides.label ?? "AIOS Vault",
    rootHandle: overrides.rootHandle ?? ({} as FileSystemDirectoryHandle),
    rootPath: overrides.rootPath ?? "/user-vault",
    spacesRoot: overrides.spacesRoot ?? "/user-vault/spaces",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    lastVerifiedAt: overrides.lastVerifiedAt,
    schemaVersion: 1,
  };
}

function readyStatus(overrides: Partial<VaultStatusResponse> = {}): VaultStatusResponse {
  return {
    initialized: true,
    vaultRoot: "/user-vault",
    spacesCount: 1,
    encryptionConfigured: true,
    kernelReady: false, // Stage 8.2 boundary: kernelReady remains false until Stage 8.4
    vaultReady: true,
    subsystems: { tbit: true },
    lastVerifiedAt: new Date().toISOString(),
    ...overrides,
  };
}

function uninitializedStatus(overrides: Partial<VaultStatusResponse> = {}): VaultStatusResponse {
  return {
    initialized: false,
    vaultRoot: undefined,
    spacesCount: 0,
    encryptionConfigured: false,
    kernelReady: false,
    vaultReady: false,
    subsystems: {},
    error: "Vault not initialized on server",
    ...overrides,
  };
}

beforeEach(() => {
  mocks.loadVaultConfig.mockReset();
  mocks.restorePermission.mockReset();
  mocks.clearVaultConfig.mockReset();
  mocks.getVaultStatus.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ──────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────

describe("useVaultInit — Initial loading state", () => {
  it("starts in the 'loading' state before the effect resolves", async () => {
    let resolveLoad: (cfg: VaultConfig | null) => void = () => {};
    mocks.loadVaultConfig.mockReturnValue(
      new Promise<VaultConfig | null>((r) => (resolveLoad = r)),
    );
    mocks.getVaultStatus.mockResolvedValue(readyStatus());

    const { result } = renderHook(() => useVaultInit());
    expect(result.current.state).toBe("loading");
    expect(result.current.vaultConfig).toBeNull();
    expect(result.current.vaultStatus).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolveLoad(null);
    });
  });
});

describe("useVaultInit — Vault discovery and restoration", () => {
  it("calls loadVaultConfig from IndexedDB on mount (Vault discovery)", async () => {
    mocks.loadVaultConfig.mockResolvedValue(null);
    mocks.getVaultStatus.mockResolvedValue(uninitializedStatus());

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(mocks.loadVaultConfig).toHaveBeenCalledTimes(1);
  });

  it("restores a saved vault when one exists in IndexedDB", async () => {
    const cfg = makeConfig({ id: "saved" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    mocks.getVaultStatus.mockResolvedValue(readyStatus());

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.vaultConfig?.id).toBe("saved");
    expect(mocks.loadVaultConfig).toHaveBeenCalled();
    expect(mocks.restorePermission).toHaveBeenCalledWith(cfg);
    expect(mocks.getVaultStatus).toHaveBeenCalled();
  });
});

describe("useVaultInit — Missing Vault", () => {
  it("transitions to onboarding when no vault config exists", async () => {
    mocks.loadVaultConfig.mockResolvedValue(null);
    mocks.getVaultStatus.mockResolvedValue(uninitializedStatus());

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(result.current.vaultConfig).toBeNull();
    expect(mocks.restorePermission).not.toHaveBeenCalled();
    expect(mocks.getVaultStatus).not.toHaveBeenCalled();
  });
});

describe("useVaultInit — Permission restoration", () => {
  it("calls restorePermission with the loaded config", async () => {
    const cfg = makeConfig({ id: "v" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    mocks.getVaultStatus.mockResolvedValue(readyStatus());

    const { result } = renderHook(() => useVaultInit());
    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(mocks.restorePermission).toHaveBeenCalledWith(cfg);
  });

  it("transitions to onboarding with a revoked-permission error when permission restore fails", async () => {
    const cfg = makeConfig({ id: "stale" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(false);
    mocks.getVaultStatus.mockResolvedValue(readyStatus());

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(result.current.vaultConfig).toBeNull();
    expect(mocks.clearVaultConfig).toHaveBeenCalledTimes(1);
    expect(result.current.error).toMatch(/revoked/i);
    expect(mocks.getVaultStatus).not.toHaveBeenCalled();
  });
});

describe("useVaultInit — Invalid Vault", () => {
  it("transitions to onboarding when server reports status.initialized=false", async () => {
    const cfg = makeConfig({ id: "v" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    mocks.getVaultStatus.mockResolvedValue(uninitializedStatus());

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(result.current.error).toMatch(/not fully initialized/i);
  });

  it("transitions to onboarding when vaultReady=false even if initialized=true", async () => {
    const cfg = makeConfig({ id: "v" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    mocks.getVaultStatus.mockResolvedValue(
      readyStatus({ initialized: true, vaultReady: false, kernelReady: false }),
    );

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(result.current.error).toMatch(/not fully initialized/i);
  });

  it("respects Stage 8.2 readiness boundary: kernelReady=false but vaultReady=true → ready", async () => {
    const cfg = makeConfig({ id: "v" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    mocks.getVaultStatus.mockResolvedValue(
      readyStatus({ initialized: true, vaultReady: true, kernelReady: false }),
    );

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.vaultStatus?.kernelReady).toBe(false);
    expect(result.current.vaultStatus?.vaultReady).toBe(true);
  });
});

describe("useVaultInit — Successful startup (ready state)", () => {
  it("transitions to ready and exposes vaultConfig + vaultStatus when all preconditions hold", async () => {
    const cfg = makeConfig({ id: "ready-vault" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    const status = readyStatus();
    mocks.getVaultStatus.mockResolvedValue(status);

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.vaultConfig?.id).toBe("ready-vault");
    expect(result.current.vaultStatus).toEqual(status);
    expect(result.current.error).toBeNull();
  });
});

describe("useVaultInit — API failure", () => {
  it("transitions to onboarding with a network error when getVaultStatus throws", async () => {
    const cfg = makeConfig({ id: "v" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    mocks.getVaultStatus.mockRejectedValue(new Error("ECONNREFUSED"));

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(result.current.error).toMatch(/ECONNREFUSED/);
    expect(result.current.vaultConfig).toBeNull();
  });

  it("captures non-Error throws as a generic message", async () => {
    const cfg = makeConfig({ id: "v" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    mocks.getVaultStatus.mockRejectedValue("weird-string");

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(result.current.error).toMatch(/Failed to verify vault/);
  });
});

describe("useVaultInit — Retry flow", () => {
  it("retry() re-runs the entire initialization sequence", async () => {
    const cfg = makeConfig({ id: "v" });

    // First attempt: API fails
    mocks.loadVaultConfig.mockResolvedValueOnce(cfg);
    mocks.restorePermission.mockResolvedValueOnce(true);
    mocks.getVaultStatus.mockRejectedValueOnce(new Error("temporary"));

    // Second attempt (after retry): success
    mocks.loadVaultConfig.mockResolvedValueOnce(cfg);
    mocks.restorePermission.mockResolvedValueOnce(true);
    mocks.getVaultStatus.mockResolvedValueOnce(readyStatus());

    const { result } = renderHook(() => useVaultInit());

    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(result.current.error).toMatch(/temporary/);

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(mocks.loadVaultConfig).toHaveBeenCalledTimes(2);
    expect(mocks.restorePermission).toHaveBeenCalledTimes(2);
    expect(mocks.getVaultStatus).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it("retry() resets state to 'loading' before any async work begins", async () => {
    // The hook's `initialize` function is memoized via useCallback with
    // dependencies on `loadVaultConfig`, `restorePermission`, and
    // `clearVaultConfig`. To observe state from within loadVaultConfig we
    // therefore need a fresh closure each time. We use a module-scoped
    // observable that the hook's bound function reads via a side effect.
    //
    // Strategy: install a loadVaultConfig implementation that never resolves
    // (so the hook stays in `loading` after the first call), then assert the
    // hook re-enters `loading` after retry() before we release the pending
    // promise.
    let resolveFirstLoad: (cfg: VaultConfig | null) => void = () => {};
    let callCount = 0;

    mocks.loadVaultConfig.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // First call (initial mount) — resolve to null so we reach onboarding.
        return Promise.resolve(null);
      }
      // Subsequent calls (including the retry) — stall so we can observe
      // the hook's intermediate `loading` state.
      return new Promise<VaultConfig | null>((r) => (resolveFirstLoad = r));
    });
    mocks.getVaultStatus.mockResolvedValue(uninitializedStatus());

    const { result } = renderHook(() => useVaultInit());
    await waitFor(() => expect(result.current.state).toBe("onboarding"));
    expect(callCount).toBe(1);

    // Invoke retry — the hook will call setState("loading") synchronously
    // before kicking off the async initialize work, which is now stalled.
    let retryPromise: Promise<void> = Promise.resolve();
    act(() => {
      retryPromise = result.current.retry();
    });

    // After retry kicks off, the hook should have transitioned back to
    // `loading` (proving setState("loading") was called synchronously) and
    // loadVaultConfig should have been invoked a second time.
    await waitFor(() => expect(callCount).toBe(2));
    await waitFor(() => expect(result.current.state).toBe("loading"));

    // Release the stalled promise and let initialize complete.
    await act(async () => {
      resolveFirstLoad(null);
      await retryPromise;
    });

    expect(result.current.state).toBe("onboarding");
  });
});

describe("useVaultInit — Manual onboarding trigger", () => {
  it("triggerOnboarding() forces the state back to 'onboarding' with cleared config", async () => {
    const cfg = makeConfig({ id: "v" });
    mocks.loadVaultConfig.mockResolvedValue(cfg);
    mocks.restorePermission.mockResolvedValue(true);
    mocks.getVaultStatus.mockResolvedValue(readyStatus());

    const { result } = renderHook(() => useVaultInit());
    await waitFor(() => expect(result.current.state).toBe("ready"));

    act(() => {
      result.current.triggerOnboarding();
    });

    expect(result.current.state).toBe("onboarding");
    expect(result.current.vaultConfig).toBeNull();
    expect(result.current.vaultStatus).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
