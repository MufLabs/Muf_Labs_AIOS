/**
 * Stage 8.4 — ProviderManager vault-aware `initializeAll()` contract tests.
 *
 * Covers:
 *   - Fan-out across mixed providers (some implement `initializeProvider`,
 *     some do not).
 *   - Per-provider failure isolation (a single failing provider does
 *     NOT abort fan-out — readiness map carries the failure signal).
 *   - Empty-registry behavior (returns `{}` without throwing).
 *   - Deterministic ordering (readiness map contains every registered
 *     provider id).
 *   - Idempotency (a second `initializeAll` call does not throw and
 *     keeps the same shape).
 *   - Configuration propagation: the same `VaultProviderConfig` reaches
 *     every provider that receives the call.
 *
 * @module Stage 8.4 / Kernel / Vault Tests
 */

import { describe, expect, it, vi } from "vitest";

import type { VaultContext, VaultProviderConfig } from "@aios/shared";

import { ProviderManager } from "../providers/ProviderManager";
import { ProviderRegistry } from "../registry";
import type { IProvider } from "../providers/IProvider";
import type { ProviderCapabilities } from "../providers/ProviderCapabilities";
import type { ProviderInfo } from "../providers/ProviderInfo";
import type { ProviderRequest } from "../providers/ProviderRequest";
import type { ProviderResponse } from "../providers/ProviderResponse";

const VAULT_CONTEXT: VaultContext = {
    vaultId: "vault-pm-test",
    vaultRoot: "/tmp/vaults/pm-test",
    spacesRoot: "/tmp/vaults/pm-test/spaces",
    spaceId: "default",
    encryptionKeyId: "key-pm-test",
    userId: "user-pm-test",
    label: "PM Test Vault",
    initializedAt: Date.now(),
};

const CONFIG: VaultProviderConfig = { vaultContext: VAULT_CONTEXT };

/**
 * Build a minimal IProvider stub. Tests can override `initializeProvider`,
 * `execute`, etc. via the returned object's methods.
 */
function makeProvider(
    id: string,
    overrides: Partial<IProvider> = {}
): IProvider {
    const info: ProviderInfo = {
        id,
        name: `Provider ${id}`,
        description: `Stub provider ${id}`,
        kind: "stub",
        tags: ["test"],
    };

    const capabilities: ProviderCapabilities = {
        streaming: false,
        cancellation: false,
        progress: false,
        vaultRead: true,
        vaultWrite: true,
    };

    return {
        id,
        name: `Provider ${id}`,
        info,
        capabilities,
        initializeProvider: undefined,
        async isAvailable(): Promise<boolean> {
            return true;
        },
        async execute(_request: ProviderRequest): Promise<ProviderResponse> {
            return {
                success: true,
                provider: id,
                content: "",
                metadata: {},
            };
        },
        ...overrides,
    } as unknown as IProvider;
}

describe("Stage 8.4 — ProviderManager.initializeAll", () => {
    it("returns an empty object when no providers are registered", async () => {
        const registry = new ProviderRegistry();
        const manager = new ProviderManager(registry);

        const readiness = await manager.initializeAll(CONFIG);

        expect(readiness).toEqual({});
    });

    it("marks a provider without initializeProvider as not-ready (false)", async () => {
        const registry = new ProviderRegistry();
        const provider = makeProvider("no-init", {
            initializeProvider: undefined,
        });
        registry.register(provider);

        const manager = new ProviderManager(registry);
        const readiness = await manager.initializeAll(CONFIG);

        expect(readiness).toEqual({ "no-init": false });
    });

    it("invokes initializeProvider on every provider that implements it", async () => {
        const registry = new ProviderRegistry();
        const a = makeProvider("a", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        const b = makeProvider("b", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        registry.register(a);
        registry.register(b);

        const manager = new ProviderManager(registry);
        const readiness = await manager.initializeAll(CONFIG);

        expect(readiness).toEqual({ a: true, b: true });
        expect(a.initializeProvider).toHaveBeenCalledTimes(1);
        expect(b.initializeProvider).toHaveBeenCalledTimes(1);
    });

    it("passes the same VaultProviderConfig to every provider", async () => {
        const registry = new ProviderRegistry();
        const a = makeProvider("a", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        const b = makeProvider("b", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        registry.register(a);
        registry.register(b);

        const manager = new ProviderManager(registry);
        await manager.initializeAll(CONFIG);

        expect(a.initializeProvider).toHaveBeenCalledWith(CONFIG);
        expect(b.initializeProvider).toHaveBeenCalledWith(CONFIG);
    });

    it("does NOT abort fan-out when a single provider throws", async () => {
        const registry = new ProviderRegistry();
        const failing = makeProvider("failing", {
            initializeProvider: vi
                .fn()
                .mockRejectedValue(new Error("boom")),
        });
        const healthy = makeProvider("healthy", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        registry.register(failing);
        registry.register(healthy);

        const manager = new ProviderManager(registry);
        const readiness = await manager.initializeAll(CONFIG);

        expect(readiness).toEqual({ failing: false, healthy: true });
        // Both providers must have been attempted
        expect(failing.initializeProvider).toHaveBeenCalledTimes(1);
        expect(healthy.initializeProvider).toHaveBeenCalledTimes(1);
    });

    it("isolates multiple failures (does not short-circuit)", async () => {
        const registry = new ProviderRegistry();
        const fail1 = makeProvider("fail-1", {
            initializeProvider: vi
                .fn()
                .mockRejectedValue(new Error("e1")),
        });
        const fail2 = makeProvider("fail-2", {
            initializeProvider: vi
                .fn()
                .mockRejectedValue(new Error("e2")),
        });
        const ok = makeProvider("ok", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        registry.register(fail1);
        registry.register(fail2);
        registry.register(ok);

        const manager = new ProviderManager(registry);
        const readiness = await manager.initializeAll(CONFIG);

        expect(readiness).toEqual({
            "fail-1": false,
            "fail-2": false,
            ok: true,
        });
    });

    it("ignores non-Error throws when marking failure (does not throw)", async () => {
        const registry = new ProviderRegistry();
        const weird = makeProvider("weird", {
            initializeProvider: vi.fn().mockRejectedValue("string"),
        });
        registry.register(weird);

        const manager = new ProviderManager(registry);
        // The fan-out must swallow non-Error throws and report false.
        const readiness = await manager.initializeAll(CONFIG);

        expect(readiness).toEqual({ weird: false });
    });

    it("includes every registered provider id in the readiness map", async () => {
        const registry = new ProviderRegistry();
        for (const id of ["p1", "p2", "p3", "p4"]) {
            registry.register(
                makeProvider(id, {
                    initializeProvider: vi
                        .fn()
                        .mockResolvedValue(undefined),
                })
            );
        }

        const manager = new ProviderManager(registry);
        const readiness = await manager.initializeAll(CONFIG);

        expect(Object.keys(readiness).sort()).toEqual(
            ["p1", "p2", "p3", "p4"]
        );
        for (const id of ["p1", "p2", "p3", "p4"]) {
            expect(readiness[id]).toBe(true);
        }
    });

    it("is idempotent: a second call leaves the readiness shape consistent", async () => {
        const registry = new ProviderRegistry();
        const a = makeProvider("a", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        const b = makeProvider("b", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        registry.register(a);
        registry.register(b);

        const manager = new ProviderManager(registry);
        const r1 = await manager.initializeAll(CONFIG);
        const r2 = await manager.initializeAll(CONFIG);

        expect(r1).toEqual({ a: true, b: true });
        expect(r2).toEqual({ a: true, b: true });
        // Idempotency: initializeProvider called twice on each provider.
        expect(a.initializeProvider).toHaveBeenCalledTimes(2);
        expect(b.initializeProvider).toHaveBeenCalledTimes(2);
    });

    it("does not call initializeProvider on unregistered providers", async () => {
        const registry = new ProviderRegistry();
        const kept = makeProvider("kept", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        const dropped = makeProvider("dropped", {
            initializeProvider: vi.fn().mockResolvedValue(undefined),
        });
        registry.register(kept);
        // dropped is never registered.

        const manager = new ProviderManager(registry);
        const readiness = await manager.initializeAll(CONFIG);

        expect(readiness).toEqual({ kept: true });
        expect(kept.initializeProvider).toHaveBeenCalledTimes(1);
        expect(dropped.initializeProvider).not.toHaveBeenCalled();
    });

    it("propagates a fresh VaultContext (not a shared instance)", async () => {
        const registry = new ProviderRegistry();
        const receiver = vi.fn().mockResolvedValue(undefined);
        registry.register(
            makeProvider("rx", { initializeProvider: receiver })
        );

        const manager = new ProviderManager(registry);
        const other: VaultContext = {
            ...VAULT_CONTEXT,
            vaultId: "other-vault",
        };

        await manager.initializeAll({ vaultContext: other });

        expect(receiver).toHaveBeenCalledWith({ vaultContext: other });
    });
});
