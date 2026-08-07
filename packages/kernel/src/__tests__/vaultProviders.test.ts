/**
 * Stage 8.4 — Vault Provider unit tests.
 *
 * Verifies the 5 vault-aware providers (Memory, Workflow, Agent,
 * QVault, LLM):
 *  - Correct id and name.
 *  - initializeProvider() captures the vault context.
 *  - execute() throws when not initialized.
 *  - execute() returns the canonical response shape after init.
 *  - Provider info declares vaultRead/vaultWrite capabilities.
 */
import { describe, it, expect } from "vitest";

import {
    Kernel,
    type VaultContext,
    type VaultProviderConfig,
    MemoryVaultProvider,
    WorkflowVaultProvider,
    AgentVaultProvider,
    QVaultVaultProvider,
    LlmVaultProvider,
    VAULT_PROVIDER_IDS,
} from "../index";

const PROVIDER_CTORS = [
    [MemoryVaultProvider, "memory-vault", "Memory Vault Provider"],
    [WorkflowVaultProvider, "workflow-vault", "Workflow Vault Provider"],
    [AgentVaultProvider, "agent-vault", "Agent Vault Provider"],
    [QVaultVaultProvider, "qvault-vault", "Q-Vault Vault Provider"],
    [LlmVaultProvider, "llm-vault", "LLM Vault Provider"],
] as const;

function makeConfig(): VaultProviderConfig {
    // No filesystem setup is required: the providers just receive the
    // VaultContext and store its values. Path-derived metadata is
    // computed lazily via getTBitSpacePaths, which tbit-core handles
    // gracefully for non-existent directories.
    const ctx: VaultContext = {
        vaultId: Kernel.generateVaultId(),
        vaultRoot: "/tmp/test-vault",
        spacesRoot: "/tmp/test-vault/spaces",
        spaceId: "user:test-user",
        encryptionKeyId: "key-test",
        userId: "test-user",
        label: "Test Vault",
        initializedAt: new Date().toISOString(),
    };
    return { vaultContext: ctx };
}

describe("Stage 8.4 — Vault Providers", () => {
    describe("id, name, and capability contracts", () => {
        for (const [Ctor, expectedId, expectedName] of PROVIDER_CTORS) {
            it(`${expectedName} has id '${expectedId}'`, () => {
                const p = new Ctor();
                expect(p.id).toBe(expectedId);
            });

            it(`${expectedName} has name '${expectedName}'`, () => {
                const p = new Ctor();
                expect(p.name).toBe(expectedName);
            });

            it(`${expectedName} declares vaultRead and vaultWrite capabilities`, () => {
                const p = new Ctor();
                expect(p.supports("vaultRead")).toBe(true);
                expect(p.supports("vaultWrite")).toBe(true);
            });

            it(`${expectedName} exposes a description in info`, () => {
                const p = new Ctor();
                expect(typeof p.info.description).toBe("string");
                expect((p.info.description ?? "").length).toBeGreaterThan(0);
            });
        }
    });

    describe("VAULT_PROVIDER_IDS", () => {
        it("contains exactly the 5 vault provider ids", () => {
            expect(new Set(VAULT_PROVIDER_IDS)).toEqual(
                new Set([
                    "memory-vault",
                    "workflow-vault",
                    "agent-vault",
                    "qvault-vault",
                    "llm-vault",
                ]),
            );
        });
    });

    describe("initializeProvider() contract", () => {
        for (const [Ctor, expectedId] of PROVIDER_CTORS) {
            it(`${expectedId} accepts a VaultProviderConfig without throwing`, async () => {
                const p = new Ctor();
                await expect(p.initializeProvider!(makeConfig())).resolves.toBeUndefined();
            });

            it(`${expectedId} is idempotent under repeated initializeProvider()`, async () => {
                const p = new Ctor();
                const cfg = makeConfig();
                await p.initializeProvider!(cfg);
                // Calling a second time with the same config must not throw.
                await expect(p.initializeProvider!(cfg)).resolves.toBeUndefined();
            });
        }
    });

    describe("execute() guards", () => {
        for (const [Ctor, expectedId] of PROVIDER_CTORS) {
            it(`${expectedId} throws when executed before initialization`, async () => {
                const p = new Ctor();
                await expect(
                    p.execute({ prompt: "hello" })
                ).rejects.toThrow(/not been initialized/);
                expect(expectedId).toBeTruthy();
            });
        }
    });

    describe("execute() response shape after init", () => {
        for (const [Ctor, expectedId] of PROVIDER_CTORS) {
            it(`${expectedId} returns success=true and the canonical shape`, async () => {
                const p = new Ctor();
                await p.initializeProvider!(makeConfig());
                const resp = await p.execute({ prompt: "hello" });

                expect(resp.success).toBe(true);
                expect(resp.provider).toBe(expectedId);
                expect(typeof resp.model).toBe("string");
                expect(typeof resp.content).toBe("string");
                expect(resp.metadata).toBeDefined();
            });
        }
    });
});
