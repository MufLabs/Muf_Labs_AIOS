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

describe("Stage 8.2 End-to-End Vault Bootstrap (functional validation)", () => {
  let vaultRoot: string;

  beforeEach(async () => {
    vaultRoot = await mkdtempAsync(join(tmpdir(), "aios-e2e-vault-"));
    (vaultBootstrapService as unknown as { initialized: boolean }).initialized = false;
    (vaultBootstrapService as unknown as { vaultRoot: string | null }).vaultRoot = null;
    (vaultBootstrapService as unknown as { spacesRoot: string | null }).spacesRoot = null;
    (vaultBootstrapService as unknown as { kernelReady: boolean }).kernelReady = false;
    (vaultBootstrapService as unknown as { subsystems: Record<string, boolean> }).subsystems = {};
  });

  afterEach(async () => {
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
    expect(status.error).toBeDefined();
  });

  it("creates vault, inits, verifies manifest + storage + status, and survives restart", async () => {
    const resp: VaultInitResponse = await vaultBootstrapService.initialize({
      vaultRoot,
      userId: "e2e-user",
      label: "E2E Space",
      generateKey: true,
    });

    expect(resp.vaultReady).toBe(true);
    expect(resp.kernelReady).toBe(false);
    // normalizeTBitSpaceId replaces ":" with "_" for filesystem safety
    expect(resp.spaceId).toContain("e2e-user");
    expect(resp.encryptionKeyId).toBeDefined();
    expect(resp.initializedAt).toBeDefined();

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
    expect(status.kernelReady).toBe(false);
    expect(status.spacesCount).toBeGreaterThanOrEqual(1);
    expect(status.encryptionConfigured).toBe(true);

    const restartService = new VaultBootstrapService();
    const postRestartStatus = await restartService.getStatus();
    expect(postRestartStatus.initialized).toBe(false);
    const reResp = await restartService.initialize({
      vaultRoot,
      userId: "e2e-user",
      generateKey: false,
    });
    expect(reResp.vaultReady).toBe(true);
    expect(reResp.spaceId).toBe(resp.spaceId);
    const finalStatus = await restartService.getStatus();
    expect(finalStatus.initialized).toBe(true);
    expect(finalStatus.vaultReady).toBe(true);
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