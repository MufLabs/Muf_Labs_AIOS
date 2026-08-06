import { Router, Request, Response } from "express";
import { vaultBootstrapService } from "../services/vaultBootstrapService";
import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

/**
 * T-Bit Vault routes (Stage 8.2 scope).
 *
 * Exposes the vault bootstrap API contract:
 *  - POST /vault/init    - Initialize a vault at a user-selected root path.
 *  - GET  /vault/status  - Report the current vault bootstrap status.
 *
 * Stage boundary: vault verify/config/migrate/repair endpoints are out of
 * scope for Stage 8.2 and are deferred to later phases per the approved
 * Phase 8 implementation plan.
 *
 * All routes in this module require API key authentication.
 */
router.use(requireSymbolicApiKey);

/**
 * POST /api/v1/tbit/vault/init
 *
 * Initialize a vault with a user-selected root path. This orchestrates the
 * linear T-Bit stack bootstrap:
 * 1. Sets vault root as the active spaces root.
 * 2. Ensures an encryption key exists.
 * 3. Creates the primary space manifest.
 * 4. Recovers T-Bit storage.
 * 5. Initializes Kernel-scoped subsystems (Stage 8.4 wiring point).
 * 6. Verifies subsystem readiness.
 *
 * Request body:
 *   - vaultRoot: string  (required) - path to the user-selected vault root.
 *   - userId: string    (required) - owner identifier for the default space.
 *   - label: string     (optional) - human-readable label for the space.
 *   - generateKey: boolean (optional) - force new key generation when none configured.
 *
 * Responses:
 *   - 201: VaultInitResponse with subsystem readiness.
 *   - 400: Missing or invalid vaultRoot/userId.
 *   - 500: Bootstrap failure.
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
      error: error instanceof Error ? error.message : "Vault initialization failed.",
    });
  }
});

/**
 * GET /api/v1/tbit/vault/status
 *
 * Get the current vault bootstrap status for this process.
 *
 * Responses:
 *   - 200: VaultStatusResponse (initialized flag, spaces count, subsystem readiness).
 *   - 500: Status query failure.
 */
router.get("/vault/status", async (_req: Request, res: Response) => {
  try {
    const status = await vaultBootstrapService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Vault status query failed.",
    });
  }
});

export default router;
