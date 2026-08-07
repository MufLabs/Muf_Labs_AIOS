import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import {
  vaultBootstrapService,
  VaultBootstrapService,
  VaultInitResponse,
  VaultStatusResponse,
} from "./vaultBootstrapService";
import { listSpaceManifests, isEncryptionConfigured } from "@muf/tbit-core";

const mkdtempAsync = promisify(mkdtemp);
const rmAsync = promisify(rm);

describe("Stage 8.4 — Vault Bootstrap E2E (with Kernel & Provider Vault Integration)", () => {
  let vaultRoot: string;

  beforeEach(async () => {
    vaultRoot = await mkdtempAsync(join(tmpdir(), "aios-stage84-vault-"));
    (vaultBootstrapService as unknown as { initialized: boolean }).initialized = false;
    (vaultBootstrapService as unknown as { vaultRoot: string | null }).vaultRoot = null;
    (vaultBootstrapService as unknown as { spacesRoot: string | null }).spacesRoot = null;
    (vaultBootstrapService as unknown as { vaultId: string | null }).vaultId = null;
    (vaultBootstrapService as unknown as { kernelReady: boolean }).kernelReady = false;
    (vaultBootstrapService as unknown as { subsystems: Record<string, boolean> }).subsystems = {};
    (vaultBootstrapService as unknown as { kernel: unknown }).kernel = null;
  });

  afterEach(async () => {
    try {
      await vaultBootstrapService.dispose();
    } catch {
      /* best-effort */
    }
    try {
      await rmAsync(vaultRoot, { recursive: true, force: true });
    } catch {
      /* cleanup best-effort */
    }
  });

  it("returns not-initialized status before init", async () => {
    const status = await vaultBootstrapService.getStatus();
    expect(status.initialized).toBe(false);
    expect(status.vaultReady).toBe(false);
    expect(status.kernelReady).toBe(false);
    expect(status.vaultId).toBeUndefined();
    expect(status.error).toBeDefined();
  });

  it("creates vault, inits, verifies manifest + storage + kernel + providers, and survives restart", async () => {
    const resp: VaultInitResponse = await vaultBootstrapService.initialize({
      vaultRoot,
      userId: "stage84-user",
      label: "Stage 8.4 Space",
      generateKey: true,
    });

    // Stage 8.2 contract preserved
    expect(resp.vaultReady).toBe(true);
    expect(resp.vaultId).toMatch(/^vault-[0-9a-f-]+$/i);
    // normalizeTBitSpaceId replaces ":" with "_" for filesystem safety
    expect(resp.spaceId).toContain("stage84-user");
    expect(resp.encryptionKeyId).toBeDefined();
    expect(resp.initializedAt).toBeDefined();

    // Stage 8.4 wiring — Kernel is now live and all vault providers are ready
    expect(resp.kernelReady).toBe(true);
    expect(resp.subsystems.memory).toBe(true);
    expect(resp.subsystems.workflow).toBe(true);
    expect(resp.subsystems.agent).toBe(true);
    expect(resp.subsystems.qvault).toBe(true);
    expect(resp.subsystems.llm).toBe(true);
    expect(resp.subsystems.provider).toBe(true);

    const spacesDir = join(vaultRoot, "spaces");
    expect(existsSync(spacesDir)).toBe(true);
    const manifests = await listSpaceManifests();
    expect(manifests.length).toBeGreaterThanOrEqual(1);
    const found = manifests.find((m) => m.spaceId === resp.spaceId);
    expect(found).toBeDefined();

    expect(await isEncryptionConfigured()).toBe(true);

    const status: VaultStatusResponse = await vaultBootstrapService.getStatus();
    expect(status.initialized).toBe(true);
    expect(status.vaultReady).toBe(true);
    expect(status.kernelReady).toBe(true);
    expect(status.vaultId).toBe(resp.vaultId);
    expect(status.spacesCount).toBeGreaterThanOrEqual(1);
    expect(status.encryptionConfigured).toBe(true);
    expect(status.subsystems.memory).toBe(true);
    expect(status.subsystems.provider).toBe(true);
  });

  it("exposes a live Kernel with the expected vault context after init", async () => {
    const resp = await vaultBootstrapService.initialize({
      vaultRoot,
      userId: "stage84-kernel",
      generateKey: true,
    });

    const kernel = vaultBootstrapService.getKernelForTesting();
    expect(kernel).not.toBeNull();
    expect(kernel).toBeDefined();
    const ctx = kernel!.vaultContext;
    expect(ctx).not.toBeNull();
    expect(ctx!.vaultId).toBe(resp.vaultId);
    expect(ctx!.vaultRoot).toBe(vaultRoot);
    expect(ctx!.spaceId).toBe(resp.spaceId);
    expect(ctx!.userId).toBe("stage84-kernel");
    expect(kernel!.isVaultInitialized).toBe(true);
    const readiness = kernel!.getProviderReadiness();
    expect(readiness["memory-vault"]).toBe(true);
    expect(readiness["workflow-vault"]).toBe(true);
    expect(readiness["agent-vault"]).toBe(true);
    expect(readiness["qvault-vault"]).toBe(true);
    expect(readiness["llm-vault"]).toBe(true);
  });

  it("emits vault.opened event when the vault is initialized", async () => {
    // Use a fresh service so we control the full lifecycle. Register
    // the listener via onVaultOpenedForTesting BEFORE initialize() so
    // it is wired to the Kernel event bus as soon as the Kernel is
    // constructed. The helper attaches the listener inside the
    // service's initialize(), before the synchronous initializeProviders()
    // call that emits vault.opened.
    const freshService = new VaultBootstrapService();
    let observedOpenedPayload: unknown = null;
    freshService.onVaultOpenedForTesting((payload) => {
      observedOpenedPayload = payload;
    });

    await freshService.initialize({
      vaultRoot,
      userId: "stage84-events",
      generateKey: true,
    });

    expect(observedOpenedPayload).not.toBeNull();
    const payload = observedOpenedPayload as {
      vaultContext: { vaultId: string };
      subsystems: Record<string, boolean>;
    };
    expect(payload.vaultContext.vaultId).toMatch(/^vault-/);
    // subsystems map is keyed by provider id (e.g. "memory-vault"),
    // not by subsystem name ("memory").
    expect(payload.subsystems["memory-vault"]).toBe(true);
    expect(payload.subsystems["workflow-vault"]).toBe(true);
    expect(payload.subsystems["agent-vault"]).toBe(true);
    expect(payload.subsystems["qvault-vault"]).toBe(true);
    expect(payload.subsystems["llm-vault"]).toBe(true);

    await freshService.dispose();
  });

  it("dispose() emits vault.closed and clears kernel state", async () => {
    await vaultBootstrapService.initialize({
      vaultRoot,
      userId: "stage84-dispose",
      generateKey: true,
    });

    const kernel = vaultBootstrapService.getKernelForTesting();
    let closedCount = 0;
    kernel!.events.on("vault.closed", () => {
      closedCount += 1;
    });

    await vaultBootstrapService.dispose();
    expect(closedCount).toBe(1);
    expect(vaultBootstrapService.getKernelForTesting()).toBeNull();

    const status = await vaultBootstrapService.getStatus();
    expect(status.initialized).toBe(false);
    expect(status.vaultReady).toBe(false);
    expect(status.kernelReady).toBe(false);
  });

  it("survives a simulated restart — re-init reuses the same space", async () => {
    const resp: VaultInitResponse = await vaultBootstrapService.initialize({
      vaultRoot,
      userId: "stage84-restart",
      generateKey: true,
    });

    const restartService = new VaultBootstrapService();
    const postRestartStatus = await restartService.getStatus();
    expect(postRestartStatus.initialized).toBe(false);

    const reResp = await restartService.initialize({
      vaultRoot,
      userId: "stage84-restart",
      generateKey: false,
    });
    expect(reResp.vaultReady).toBe(true);
    expect(reResp.kernelReady).toBe(true);
    expect(reResp.spaceId).toBe(resp.spaceId);
    // vaultId is regenerated on each fresh service instance
    expect(reResp.vaultId).toMatch(/^vault-/);
    expect(reResp.vaultId).not.toBe(resp.vaultId);

    const finalStatus = await restartService.getStatus();
    expect(finalStatus.initialized).toBe(true);
    expect(finalStatus.vaultReady).toBe(true);
    expect(finalStatus.kernelReady).toBe(true);
    expect(finalStatus.spacesCount).toBeGreaterThanOrEqual(1);
  });

  it("rejects init with missing vaultRoot or userId", async () => {
    await expect(
      vaultBootstrapService.initialize({ vaultRoot: "", userId: "x" })
    ).rejects.toThrow();
    await expect(
      vaultBootstrapService.initialize({ vaultRoot: "x", userId: "" })
    ).rejects.toThrow();
  });
});
