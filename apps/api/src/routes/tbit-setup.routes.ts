import { Router, Request, Response } from "express";
import {
  isEncryptionConfigured,
  createSpaceManifest,
  listSpaceManifests,
  getActiveEncryptionKeyAsync,
  generateEncryptionKey,
  normalizeTBitSpaceId,
  getTBitSpacePaths,
  normalizeTBitVaultRoot,
  setActiveTBitSpacesRoot,
} from "@muf/tbit-core";
import { TBitStorageService, TBitStorageConfig } from "@muf/tbit-core";
import { createHash } from "crypto";
import path from "path";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/setup/status
 * Get first-run setup status
 */
router.get("/setup/status", async (_req: Request, res: Response) => {
  try {
    const encryptionConfigured = await isEncryptionConfigured();
    const spaces = await listSpaceManifests();
    res.json({
      initialized: encryptionConfigured && spaces.length > 0,
      encryptionConfigured,
      spacesCount: spaces.length,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo consultando estado de setup.",
    });
  }
});

/**
 * POST /api/v1/tbit/setup/bootstrap
 * Bootstrap first-run setup
 * Optional vaultRoot parameter allows vault-aware initialization
 */
router.post("/setup/bootstrap", async (req: Request, res: Response) => {
  try {
    const { userId, label, generateKey, vaultRoot } = req.body ?? {};

    if (!userId?.trim()) {
      res.status(400).json({ ok: false, error: "bootstrapSetup requiere userId." });
      return;
    }

    // If vaultRoot provided, set it as the active spaces root
    if (vaultRoot?.trim()) {
      const normalizedVaultRoot = normalizeTBitVaultRoot(vaultRoot.trim());
      const spacesRoot = path.join(normalizedVaultRoot, "spaces");
      setActiveTBitSpacesRoot(spacesRoot);
    }

    const spaceId = `user:${normalizeTBitSpaceId(userId.trim())}`;
    const spaceLabel = label?.trim() ?? `AIOS Space ${userId.trim()}`;

    // 1) Encryption key — generate if requested and none configured yet
    let encryptionKeyId: string;
    const configured = await isEncryptionConfigured();

    if (generateKey && !configured) {
      const key = await generateEncryptionKey(`key-${normalizeTBitSpaceId(userId.trim())}`);
      encryptionKeyId = key.id;
    } else {
      const key = configured
        ? await getActiveEncryptionKeyAsync()
        : await generateEncryptionKey(`key-${normalizeTBitSpaceId(userId.trim())}`);
      encryptionKeyId = key.id;
    }

    // 2) Persist space manifest + directory scaffold
    const manifest = await createSpaceManifest({ spaceId, label: spaceLabel, userId: userId.trim() });

    // 3) Recover storage to validate container is usable with the active key
    const paths = getTBitSpacePaths(spaceId);
    const activeKey = await getActiveEncryptionKeyAsync();
    const hmacKeyId = activeKey?.id ?? "hmac-v1";
    const hmacSecret = activeKey?.secret
      ? createHash("sha256").update(activeKey.secret).digest("hex")
      : createHash("sha256").update("dev-hmac-secret").digest("hex");

    const config: TBitStorageConfig = {
      name: "default",
      containerPath: paths.containerPath,
      metadataPath: paths.metadataPath,
      walPath: paths.walPath,
      snapshotsDir: paths.snapshotsDir,
      replicasDir: paths.replicasDir,
      exportsDir: path.join(paths.rootDir, "exports"),
      lockPath: paths.lockPath,
      hmacSecrets: new Map([[hmacKeyId, hmacSecret]]),
      hmacKeyId,
      maxDatoBytes: 64 * 1024,
      maxRecords: 500,
      containerSizeMB: 10,
    };

    const storage = new TBitStorageService(config);
    await storage.recover();

    const response: Record<string, unknown> = {
      containerId: manifest.spaceId,
      spaceId: manifest.spaceId,
      label: manifest.label,
      manifest,
      encryptionKeyId,
      ready: true,
    };

    // Include vaultRoot in response if it was provided
    if (vaultRoot?.trim()) {
      response.vaultRoot = normalizeTBitVaultRoot(vaultRoot.trim());
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en bootstrap de setup.",
    });
  }
});

export default router;
