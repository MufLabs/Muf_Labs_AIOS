// @vitest-environment jsdom

/**
 * Stage 8.3 — useVaultPicker Test Suite
 *
 * Verifies the IndexedDB persistence, File System Access API integration,
 * permission restore/revoke, browser-compatibility behavior, and error
 * handling of the hook implemented in `useVaultPicker.ts`.
 *
 * External browser APIs (IndexedDB, File System Access API) are mocked at
 * the module boundary. Business logic is exercised directly.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { VaultConfig } from "../types/vault";

// ──────────────────────────────────────────────────────────────────────────
// In-memory IndexedDB shim. Classes must live INSIDE vi.hoisted so the
// vi.mock("idb", ...) factory closure can capture them without falling
// into TDZ at hoist time.
// ──────────────────────────────────────────────────────────────────────────

const hoisted = vi.hoisted(() => {
  interface StoreEntry {
    key: string;
    value: VaultConfig;
  }

  class FakeObjectStore {
    private records = new Map<string, StoreEntry>();
    private indexFields = new Map<string, string>();

    constructor(public name: string, public keyPath: string) {}

    createIndex(indexName: string, indexKeyPath: string, _options?: unknown) {
      this.indexFields.set(indexName, indexKeyPath);
      return { name: indexName, keyPath: indexKeyPath };
    }

    async put(value: VaultConfig): Promise<string> {
      const key = (value as unknown as Record<string, string>)[this.keyPath];
      this.records.set(key, { key, value });
      return key;
    }

    async getAll(): Promise<VaultConfig[]> {
      return Array.from(this.records.values()).map((r) => r.value);
    }

    async getAllFromIndex(indexName: string): Promise<VaultConfig[]> {
      const keyPath = this.indexFields.get(indexName);
      if (!keyPath) return [];
      return Array.from(this.records.values())
        .map((r) => r.value)
        .sort((a, b) => {
          const av = (a as unknown as Record<string, string>)[keyPath] ?? "";
          const bv = (b as unknown as Record<string, string>)[keyPath] ?? "";
          return av.localeCompare(bv);
        });
    }

    async delete(key: string): Promise<void> {
      this.records.delete(key);
    }

    async clear(): Promise<void> {
      this.records.clear();
    }
  }

  class FakeIDBDatabase {
    stores = new Map<string, FakeObjectStore>();
    objectStoreNames = {
      contains: (n: string) => this.stores.has(n),
    };

    transaction(storeNames: string[], _mode: string) {
      for (const name of storeNames) {
        if (!this.stores.has(name)) {
          this.stores.set(name, new FakeObjectStore(name, "id"));
        }
      }
      return {
        objectStore: (name: string) => this.stores.get(name)!,
        done: Promise.resolve(),
      };
    }

    createObjectStore(name: string, options: { keyPath: string }) {
      const store = new FakeObjectStore(name, options.keyPath);
      this.stores.set(name, store);
      return store;
    }

    async put(storeName: string, value: VaultConfig) {
      const store = this.stores.get(storeName);
      if (!store) throw new Error(`Object store '${storeName}' not found`);
      return store.put(value);
    }
    async getAll(storeName: string) {
      const store = this.stores.get(storeName);
      if (!store) return [];
      return store.getAll();
    }
    async getAllFromIndex(storeName: string, indexName: string) {
      const store = this.stores.get(storeName);
      if (!store) return [];
      return store.getAllFromIndex(indexName);
    }
    async delete(storeName: string, key: string) {
      const store = this.stores.get(storeName);
      if (!store) return;
      return store.delete(key);
    }

    close() {
      /* no-op */
    }
  }

  const db = new FakeIDBDatabase();

  return {
    db,
    openDB: vi.fn(
      async (
        _name: string,
        _version: number,
        opts?: { upgrade?: (db: FakeIDBDatabase) => void },
      ) => {
        // Always run the upgrade callback (matches idb semantics and gives
        // each test a fresh store).
        if (opts?.upgrade) opts.upgrade(db);
        return db as unknown;
      },
    ),
  };
});

vi.mock("idb", () => ({
  openDB: (...args: unknown[]) =>
    (hoisted.openDB as unknown as (...a: unknown[]) => Promise<unknown>)(...(args as [string, number, unknown])),
}));

// `useVaultPicker` is imported lazily inside each test via dynamic import so
// the module-level `dbPromise` cache is reset between tests.
async function freshUseVaultPicker() {
  vi.resetModules();
  const mod = await import("./useVaultPicker");
  return mod.useVaultPicker;
}

// ──────────────────────────────────────────────────────────────────────────
// FileSystemDirectoryHandle factory
// ──────────────────────────────────────────────────────────────────────────

function makeHandle(opts: {
  name?: string;
  queryPermission?: "granted" | "prompt" | "denied";
  requestPermission?: "granted" | "prompt" | "denied";
  throwOnQuery?: boolean;
  throwOnRequest?: boolean;
}) {
  const handle = {
    name: opts.name ?? "user-vault",
    queryPermission: vi.fn(async () => {
      if (opts.throwOnQuery) throw new Error("stale handle");
      return opts.queryPermission ?? "granted";
    }),
    requestPermission: vi.fn(async () => {
      if (opts.throwOnRequest) throw new Error("user denied");
      return opts.requestPermission ?? "granted";
    }),
  };
  return handle;
}

function makeConfig(overrides: Partial<VaultConfig> = {}): VaultConfig {
  const handle = makeHandle({});
  return {
    id: overrides.id ?? crypto.randomUUID(),
    label: overrides.label ?? "AIOS Vault",
    rootHandle: overrides.rootHandle ?? (handle as unknown as FileSystemDirectoryHandle),
    rootPath: overrides.rootPath ?? "/user-vault",
    spacesRoot: overrides.spacesRoot ?? "/user-vault/spaces",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    lastVerifiedAt: overrides.lastVerifiedAt,
    schemaVersion: 1,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Browser-compat scenarios
// ──────────────────────────────────────────────────────────────────────────

let originalShowDirectoryPicker: unknown;

beforeEach(() => {
  hoisted.db.stores.clear();
  hoisted.openDB.mockClear();
  originalShowDirectoryPicker = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
});

afterEach(() => {
  (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = originalShowDirectoryPicker;
  vi.restoreAllMocks();
});

// ──────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────

describe("useVaultPicker — IndexedDB persistence", () => {
  it("loadVaultConfig returns null when no vault has been saved", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const { result } = renderHook(() => useVaultPicker());
    const config = await act(async () => result.current.loadVaultConfig());
    expect(config).toBeNull();
  });

  it("saveVaultConfig persists and loadVaultConfig restores the same config", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const { result } = renderHook(() => useVaultPicker());
    const cfg = makeConfig({ id: "vault-1", rootPath: "/alpha" });

    await act(async () => {
      await result.current.saveVaultConfig(cfg);
    });

    const loaded = await act(async () => result.current.loadVaultConfig());
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe("vault-1");
    expect(loaded!.rootPath).toBe("/alpha");
    expect(loaded!.schemaVersion).toBe(1);
  });

  it("loadVaultConfig returns the most recently created vault when multiple exist", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const { result } = renderHook(() => useVaultPicker());

    await act(async () => {
      await result.current.saveVaultConfig(
        makeConfig({ id: "v1", createdAt: "2024-01-01T00:00:00.000Z" }),
      );
      await result.current.saveVaultConfig(
        makeConfig({ id: "v2", createdAt: "2024-06-01T00:00:00.000Z" }),
      );
      await result.current.saveVaultConfig(
        makeConfig({ id: "v3", createdAt: "2025-01-01T00:00:00.000Z" }),
      );
    });

    const loaded = await act(async () => result.current.loadVaultConfig());
    expect(loaded!.id).toBe("v3");
  });

  it("clearVaultConfig removes all saved vaults", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const { result } = renderHook(() => useVaultPicker());
    await act(async () => {
      await result.current.saveVaultConfig(makeConfig({ id: "v1" }));
      await result.current.saveVaultConfig(makeConfig({ id: "v2" }));
    });

    let loaded = await act(async () => result.current.loadVaultConfig());
    expect(loaded).not.toBeNull();

    await act(async () => {
      await result.current.clearVaultConfig();
    });

    loaded = await act(async () => result.current.loadVaultConfig());
    expect(loaded).toBeNull();
  });
});

describe("useVaultPicker — Folder selection", () => {
  it("pickVaultFolder opens the native picker and saves the chosen handle", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const handle = makeHandle({ name: "my-vault" });
    (window as unknown as { showDirectoryPicker: () => Promise<unknown> }).showDirectoryPicker = vi
      .fn()
      .mockResolvedValue(handle);

    const { result } = renderHook(() => useVaultPicker());
    expect(result.current.isSupported).toBe(true);

    const cfg = await act(async () => result.current.pickVaultFolder("My Label"));
    expect(cfg).not.toBeNull();
    expect(cfg!.label).toBe("My Label");
    expect(cfg!.rootHandle).toBe(handle);

    const loaded = await act(async () => result.current.loadVaultConfig());
    expect(loaded!.id).toBe(cfg!.id);
  });

  it("pickVaultFolder returns null when the user cancels (AbortError)", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    (window as unknown as { showDirectoryPicker: () => Promise<unknown> }).showDirectoryPicker = vi
      .fn()
      .mockRejectedValue(new DOMException("User aborted", "AbortError"));

    const { result } = renderHook(() => useVaultPicker());
    const cfg = await act(async () => result.current.pickVaultFolder());
    expect(cfg).toBeNull();
  });

  it("pickVaultFolder throws when the browser lacks File System Access API support", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = undefined;
    const { result } = renderHook(() => useVaultPicker());
    expect(result.current.isSupported).toBe(false);
    await expect(act(async () => result.current.pickVaultFolder())).rejects.toThrow(
      /File System Access API not supported/,
    );
  });

  it("pickVaultFolder throws 'Permission denied' when the user refuses folder access", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const handle = makeHandle({
      queryPermission: "denied",
      requestPermission: "denied",
    });
    (window as unknown as { showDirectoryPicker: () => Promise<unknown> }).showDirectoryPicker = vi
      .fn()
      .mockResolvedValue(handle);

    const { result } = renderHook(() => useVaultPicker());
    await expect(act(async () => result.current.pickVaultFolder())).rejects.toThrow(/Permission denied/);
  });
});

describe("useVaultPicker — Permission restoration, revocation, and recovery", () => {
  it("restorePermission returns true immediately when permission is already granted", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const handle = makeHandle({ queryPermission: "granted" });
    const { result } = renderHook(() => useVaultPicker());

    const ok = await act(async () =>
      result.current.restorePermission(
        makeConfig({ rootHandle: handle as unknown as FileSystemDirectoryHandle }),
      ),
    );
    expect(ok).toBe(true);
    expect(handle.requestPermission).not.toHaveBeenCalled();
  });

  it("restorePermission requests permission when queryPermission returns 'prompt'", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const handle = makeHandle({ queryPermission: "prompt", requestPermission: "granted" });
    const { result } = renderHook(() => useVaultPicker());

    const ok = await act(async () =>
      result.current.restorePermission(
        makeConfig({ rootHandle: handle as unknown as FileSystemDirectoryHandle }),
      ),
    );
    expect(ok).toBe(true);
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
  });

  it("restorePermission returns false when the user denies re-request (revoked permission)", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const handle = makeHandle({ queryPermission: "prompt", requestPermission: "denied" });
    const { result } = renderHook(() => useVaultPicker());

    const ok = await act(async () =>
      result.current.restorePermission(
        makeConfig({ rootHandle: handle as unknown as FileSystemDirectoryHandle }),
      ),
    );
    expect(ok).toBe(false);
    expect(handle.requestPermission).toHaveBeenCalled();
  });

  it("restorePermission returns false on a stale / invalid handle (queryPermission throws)", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    // A stale handle fails at EVERY permission call (query and request both
    // throw because the underlying handle reference is no longer valid).
    const handle = makeHandle({ throwOnQuery: true, throwOnRequest: true });
    const { result } = renderHook(() => useVaultPicker());

    const ok = await act(async () =>
      result.current.restorePermission(
        makeConfig({ rootHandle: handle as unknown as FileSystemDirectoryHandle }),
      ),
    );
    expect(ok).toBe(false);
  });

  it("restorePermission returns false when File System Access API is not supported", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = undefined;
    const { result } = renderHook(() => useVaultPicker());
    expect(result.current.isSupported).toBe(false);

    const ok = await act(async () => result.current.restorePermission(makeConfig()));
    expect(ok).toBe(false);
  });

  it("restorePermission updates lastVerifiedAt on successful re-grant", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const handle = makeHandle({ queryPermission: "prompt", requestPermission: "granted" });
    const { result } = renderHook(() => useVaultPicker());
    const cfg = makeConfig({ rootHandle: handle as unknown as FileSystemDirectoryHandle });
    expect(cfg.lastVerifiedAt).toBeUndefined();

    await act(async () => result.current.restorePermission(cfg));
    expect(cfg.lastVerifiedAt).toBeDefined();
    expect(new Date(cfg.lastVerifiedAt!).getTime()).toBeGreaterThan(0);
  });
});

describe("useVaultPicker — Missing and invalid handle handling", () => {
  it("loadVaultConfig returns null when the IndexedDB store is empty (missing handle)", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const { result } = renderHook(() => useVaultPicker());
    const loaded = await act(async () => result.current.loadVaultConfig());
    expect(loaded).toBeNull();
  });

  it("clearVaultConfig is a no-op when there are no saved vaults (missing handle)", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    const { result } = renderHook(() => useVaultPicker());
    await act(async () => {
      await expect(result.current.clearVaultConfig()).resolves.toBeUndefined();
    });
  });

  it("restorePermission gracefully handles an invalid handle (queryPermission throws)", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    // An invalid/stale handle fails at EVERY permission call (query and
    // request both throw because the underlying handle reference is no
    // longer valid). This guarantees restorePermission returns false without
    // throwing, regardless of which call fails first.
    const handle = makeHandle({ throwOnQuery: true, throwOnRequest: true });
    const { result } = renderHook(() => useVaultPicker());

    const ok = await act(async () =>
      result.current.restorePermission(
        makeConfig({ rootHandle: handle as unknown as FileSystemDirectoryHandle }),
      ),
    );
    expect(ok).toBe(false);
  });
});

describe("useVaultPicker — Browser compatibility behavior", () => {
  it("isSupported is true when window.showDirectoryPicker is a function", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = vi.fn();
    const { result } = renderHook(() => useVaultPicker());
    expect(result.current.isSupported).toBe(true);
  });

  it("isSupported is false when window.showDirectoryPicker is missing", async () => {
    const useVaultPicker = await freshUseVaultPicker();
    (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = undefined;
    const { result } = renderHook(() => useVaultPicker());
    expect(result.current.isSupported).toBe(false);
  });
});
