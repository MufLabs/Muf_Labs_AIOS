import { Router, Request, Response } from "express";
import { vaultBootstrapService } from "../services/vaultBootstrapService";
import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * POST /api/v1/tbit/vault/init
 * Initialize a vault with user-selected root path.
 * This is the Phase 8 vault-aware bootstrap that:
 * 1. Sets vault root as active spaces root
 * 2. Ensures encryption key exists
 * 3. Creates primary space manifest
 * 4. Recovers T-Bit storage
 * 5. Initializes Kernel with vault-aware providers
 * 6. Verifies all subsystems
 */
router.post("/vault/init", async (req: Request, res: Response) => {
  try {
    const { vaultRoot, userId, label, generateKey } = req.body ?? {};

    if (!vaultRoot?.trim()) {
      res.status(400).json({ ok: false, error: "vaultRoot is required." });
      return;
    }
    if (!userId?.trim()) {
      res.status(400).json({ ok: false, error: "userId is required." });
      return;
    }

    const result = await vaultBootstrapService.initialize({
      vaultRoot: vaultRoot.trim(),
      userId: userId.trim(),
      label: label?.trim(),
      generateKey,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en inicialización de vault.",
    });
  }
});

/**
 * GET /api/v1/tbit/vault/status
 * Get current vault initialization status
 */
router.get("/vault/status", async (_req: Request, res: Response) => {
  try {
    const status = await vaultBootstrapService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo consultando estado de vault.",
    });
  }
});

/**
 * GET /api/v1/tbit/vault/verify
 * Verify a vault path is accessible and has valid structure
 */
router.get("/vault/verify", async (req: Request, res: Response) => {
  try {
    const { vaultRoot } = req.query;

    if (!vaultRoot || typeof vaultRoot !== "string") {
      res.status(400).json({ ok: false, error: "vaultRoot query parameter is required." });
      return;
    }

    const result = await vaultBootstrapService.verify(vaultRoot);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en verificación de vault.",
    });
  }
});

/**
 * GET /api/v1/tbit/vault/config
 * Get vault configuration details
 */
router.get("/vault/config", async (_req: Request, res: Response) => {
  try {
    const config = await vaultBootstrapService.getConfig();
    if (!config) {
      res.status(404).json({ ok: false, error: "Vault not initialized" });
      return;
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo obteniendo configuración de vault.",
    });
  }
});

/**
 * POST /api/v1/tbit/vault/migrate
 * Run schema migrations on vault
 */
router.post("/vault/migrate", async (req: Request, res: Response) => {
  try {
    const { vaultRoot } = req.body ?? {};

    if (!vaultRoot?.trim()) {
      res.status(400).json({ ok: false, error: "vaultRoot is required." });
      return;
    }

    await vaultBootstrapService.migrate(vaultRoot.trim());
    res.json({ ok: true, message: "Migration completed" });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en migración de vault.",
    });
  }
});

/**
 * POST /api/v1/tbit/vault/repair
 * Attempt corruption recovery on vault
 */
router.post("/vault/repair", async (req: Request, res: Response) => {
  try {
    const { vaultRoot } = req.body ?? {};

    if (!vaultRoot?.trim()) {
      res.status(400).json({ ok: false, error: "vaultRoot is required." });
      return;
    }

    const result = await vaultBootstrapService.repair(vaultRoot.trim());
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en reparación de vault.",
    });
  }
});

export default router;
