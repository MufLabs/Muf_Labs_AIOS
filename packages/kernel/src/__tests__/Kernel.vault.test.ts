/**
 * Stage 8.4 — Kernel vault awareness unit tests.
 *
 * Verifies the vault-aware Kernel API:
 *  - Vault context lifecycle (set, attach, dispose).
 *  - Vault event emission (vault.opened, vault.switched, vault.closed).
 *  - Provider fan-out via ProviderManager.initializeAll().
 *  - Phase 7 backward compatibility (boot, shutdown, context getter, isRunning).
 *  - Static `generateVaultId()` helper.
 */
import { describe, it, expect, beforeEach } from "vitest";

import {
    Kernel,
    type VaultContext,
    VAULT_EVENTS,
    MemoryVaultProvider,
    WorkflowVaultProvider,
    AgentVaultProvider,
    QVaultVaultProvider,
    LlmVaultProvider,
    VAULT_PROVIDER_IDS,
    type VaultOpenedPayload,
    type VaultClosedPayload,
    type VaultSwitchedPayload,
} from "../index";

function makeVaultContext(overrides: Partial<VaultContext> = {}): VaultContext {
    return {
        vaultId: Kernel.generateVaultId(),
        vaultRoot: "/tmp/test-vault",
        spacesRoot: "/tmp/test-vault/spaces",
        spaceId: "user:test-user",
        encryptionKeyId: "key-test",
        userId: "test-user",
        label: "Test Vault",
        initializedAt: new Date().toISOString(),
        ...overrides,
    };
}

describe("Stage 8.4 — Kernel vault awareness", () => {
    let kernel: Kernel;
    let ctx: VaultContext;

    beforeEach(() => {
        ctx = makeVaultContext();
        kernel = new Kernel(ctx);
    });

    describe("construction", () => {
        it("exposes the vault context passed to the constructor", () => {
            expect(kernel.vaultContext).toBe(ctx);
        });

        it("does not auto-initialize providers (idempotency guard)", () => {
            expect(kernel.isVaultInitialized).toBe(false);
        });

        it("can be constructed without a vault context (legacy mode)", () => {
            const k = new Kernel();
            expect(k.vaultContext).toBeNull();
            expect(k.isVaultInitialized).toBe(false);
        });

        it("exposes a non-null provider registry", () => {
            expect(kernel.providers).toBeDefined();
            expect(typeof kernel.providers.register).toBe("function");
        });
    });

    describe("generateVaultId()", () => {
        it("returns a string prefixed with 'vault-'", () => {
            const id = Kernel.generateVaultId();
            expect(id).toMatch(/^vault-[0-9a-f-]+$/i);
        });

        it("returns a unique id on each call", () => {
            const ids = new Set<string>();
            for (let i = 0; i < 10; i++) {
                ids.add(Kernel.generateVaultId());
            }
            expect(ids.size).toBe(10);
        });
    });

    describe("setVaultContext()", () => {
        it("updates the vault context and resets providersInitialized", () => {
            const ctx2 = makeVaultContext();
            kernel.setVaultContext(ctx2);
            expect(kernel.vaultContext).toBe(ctx2);
            expect(kernel.isVaultInitialized).toBe(false);
        });

        it("emits vault.switched when a previous vault exists", async () => {
            const ctx2 = makeVaultContext();
            const events: VaultSwitchedPayload[] = [];
            kernel.events.on(VAULT_EVENTS.SWITCHED, (payload: unknown) => {
                events.push(payload as VaultSwitchedPayload);
            });

            kernel.setVaultContext(ctx2);
            expect(events.length).toBe(1);
            expect(events[0].previous).toBe(ctx);
            expect(events[0].current).toBe(ctx2);
        });

        it("does not emit vault.switched on first setVaultContext()", () => {
            const k = new Kernel();
            const events: unknown[] = [];
            k.events.on(VAULT_EVENTS.SWITCHED, (payload: unknown) => {
                events.push(payload);
            });
            k.setVaultContext(ctx);
            expect(events.length).toBe(0);
        });
    });

    describe("initializeProviders()", () => {
        it("throws when no vault context has been attached", async () => {
            const k = new Kernel();
            await expect(k.initializeProviders()).rejects.toThrow(/VaultContext/);
        });

        it("fans out initializeProvider() to every registered provider", async () => {
            const providers = [
                new MemoryVaultProvider(),
                new WorkflowVaultProvider(),
                new AgentVaultProvider(),
                new QVaultVaultProvider(),
                new LlmVaultProvider(),
            ];
            for (const p of providers) {
                kernel.providers.register(p);
            }

            let capturedConfig: unknown = null;
            // Spy on one of the providers to verify config is passed through.
            const spy = providers[0] as unknown as {
                initializeProvider: (c: unknown) => Promise<void>;
            };
            const original = spy.initializeProvider.bind(providers[0]);
            spy.initializeProvider = async (c: unknown) => {
                capturedConfig = c;
                return original(c as never);
            };

            await kernel.initializeProviders();

            expect(capturedConfig).not.toBeNull();
            expect((capturedConfig as { vaultContext: VaultContext }).vaultContext).toBe(ctx);

            const readiness = kernel.getProviderReadiness();
            for (const id of VAULT_PROVIDER_IDS) {
                expect(readiness[id]).toBe(true);
            }

            expect(kernel.isVaultInitialized).toBe(true);
        });

        it("emits vault.opened after successful fan-out", async () => {
            kernel.providers.register(new MemoryVaultProvider());

            const events: VaultOpenedPayload[] = [];
            kernel.events.on(VAULT_EVENTS.OPENED, (payload: unknown) => {
                events.push(payload as VaultOpenedPayload);
            });

            await kernel.initializeProviders();

            expect(events.length).toBe(1);
            expect(events[0].vaultContext).toBe(ctx);
            expect(events[0].subsystems["memory-vault"]).toBe(true);
        });

        it("marks a provider as not ready when initializeProvider throws", async () => {
            const failingProvider = new MemoryVaultProvider();
            (failingProvider as unknown as {
                initializeProvider: () => Promise<void>;
            }).initializeProvider = async () => {
                throw new Error("simulated init failure");
            };
            kernel.providers.register(failingProvider);
            kernel.providers.register(new WorkflowVaultProvider());

            await kernel.initializeProviders();

            const readiness = kernel.getProviderReadiness();
            expect(readiness["memory-vault"]).toBe(false);
            expect(readiness["workflow-vault"]).toBe(true);
        });

        it("reports providers without initializeProvider as not ready", async () => {
            // Register only one provider that lacks initializeProvider.
            // Use a stripped-down provider that omits the hook.
            const noHookProvider = {
                id: "bare-provider",
                name: "Bare Provider",
                info: {
                    id: "bare-provider",
                    name: "Bare Provider",
                    vendor: "test",
                    models: [],
                    capabilities: {},
                    kind: "test",
                    tags: [],
                    description: "Provider without initializeProvider hook",
                },
                async isAvailable() {
                    return true;
                },
                async execute() {
                    return {
                        success: true,
                        provider: "bare-provider",
                        content: "",
                        model: "test",
                        metadata: {},
                    };
                },
                getInfo() {
                    return this.info;
                },
                supports() {
                    return false;
                },
            };
            kernel.providers.register(noHookProvider as unknown as MemoryVaultProvider);

            await kernel.initializeProviders();
            const readiness = kernel.getProviderReadiness();
            expect(readiness["bare-provider"]).toBe(false);
        });

        it("is idempotent — second call after setVaultContext emits fresh vault.opened", async () => {
            kernel.providers.register(new MemoryVaultProvider());

            let openedCount = 0;
            kernel.events.on(VAULT_EVENTS.OPENED, () => {
                openedCount += 1;
            });

            await kernel.initializeProviders();
            expect(openedCount).toBe(1);

            // setVaultContext resets providersInitialized
            kernel.setVaultContext(makeVaultContext());
            await kernel.initializeProviders();
            expect(openedCount).toBe(2);
        });
    });

    describe("disposeVault()", () => {
        it("emits vault.closed and clears the vault context", async () => {
            kernel.providers.register(new MemoryVaultProvider());
            await kernel.initializeProviders();

            const events: VaultClosedPayload[] = [];
            kernel.events.on(VAULT_EVENTS.CLOSED, (payload: unknown) => {
                events.push(payload as VaultClosedPayload);
            });

            await kernel.disposeVault();
            expect(events.length).toBe(1);
            expect(events[0].vaultId).toBe(ctx.vaultId);
            expect(typeof events[0].closedAt).toBe("string");
            expect(kernel.vaultContext).toBeNull();
            expect(kernel.isVaultInitialized).toBe(false);
        });

        it("is a no-op when no vault is active", async () => {
            const k = new Kernel();
            await expect(k.disposeVault()).resolves.toBeUndefined();
        });
    });

    describe("getProviderReadiness()", () => {
        it("returns an empty object before initializeProviders()", () => {
            expect(kernel.getProviderReadiness()).toEqual({});
        });

        it("returns a snapshot of the last readiness map", async () => {
            kernel.providers.register(new MemoryVaultProvider());
            await kernel.initializeProviders();

            const readiness = kernel.getProviderReadiness();
            expect(readiness["memory-vault"]).toBe(true);

            // The snapshot is a copy, not a reference.
            readiness["memory-vault"] = false;
            const again = kernel.getProviderReadiness();
            expect(again["memory-vault"]).toBe(true);
        });
    });

    describe("Phase 7 backward compatibility", () => {
        it("boot() sets isRunning to true", () => {
            expect(kernel.isRunning).toBe(false);
            kernel.boot();
            expect(kernel.isRunning).toBe(true);
        });

        it("boot() is idempotent", () => {
            kernel.boot();
            kernel.boot();
            expect(kernel.isRunning).toBe(true);
        });

        it("shutdown() resets isRunning to false", () => {
            kernel.boot();
            kernel.shutdown();
            expect(kernel.isRunning).toBe(false);
        });

        it("shutdown() is a no-op when not booted", () => {
            expect(() => kernel.shutdown()).not.toThrow();
            expect(kernel.isRunning).toBe(false);
        });

        it("emits kernel.started on first boot()", () => {
            const events: unknown[] = [];
            kernel.events.on("kernel.started", (p: unknown) => events.push(p));
            kernel.boot();
            expect(events.length).toBe(1);
        });

        it("emits kernel.stopped on shutdown()", () => {
            kernel.boot();
            const events: unknown[] = [];
            kernel.events.on("kernel.stopped", (p: unknown) => events.push(p));
            kernel.shutdown();
            expect(events.length).toBe(1);
        });

        it("exposes a `context` getter with a services registry", () => {
            expect(kernel.context).toBeDefined();
            expect(kernel.context.services).toBeDefined();
        });

        it("returns the same context object across calls", () => {
            expect(kernel.context).toBe(kernel.context);
        });
    });

    describe("execute() end-to-end with vault-aware providers", () => {
        it("runs a vault-aware provider and returns its response", async () => {
            // Use the real MemoryVaultProvider. It implements
            // initializeProvider() so we exercise the full wiring.
            kernel.providers.register(new MemoryVaultProvider());
            await kernel.initializeProviders();

            const resp = await kernel.execute(kernel.context, {
                prompt: "hello",
            });
            expect(resp.success).toBe(true);
            expect(resp.provider).toBe("memory-vault");
        });

        it("runs a non-vault-aware legacy provider without context", async () => {
            const k = new Kernel();
            // Register a stub provider that does not implement
            // initializeProvider so it works in the legacy path.
            const stub = {
                id: "stub-legacy",
                name: "Stub Legacy",
                info: {
                    id: "stub-legacy",
                    name: "Stub Legacy",
                    vendor: "test",
                    models: [],
                    capabilities: {},
                    kind: "test",
                    tags: [],
                    description: "Legacy stub provider",
                },
                async isAvailable() {
                    return true;
                },
                async execute() {
                    return {
                        success: true,
                        provider: this.id,
                        content: "ok",
                        model: "stub",
                        metadata: {},
                    };
                },
                getInfo() {
                    return this.info;
                },
                supports() {
                    return false;
                },
            };
            k.providers.register(stub as unknown as MemoryVaultProvider);

            const resp = await k.execute(k.context, {
                prompt: "hello",
            });
            expect(resp.success).toBe(true);
            expect(resp.provider).toBe("stub-legacy");
        });
    });
});
