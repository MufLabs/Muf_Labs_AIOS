import { Router, Request, Response } from "express";
import {
  getContainerHealthReport,
  reconcileContainerHealth,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth.js";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/health/container
 * Get container health report
 */
router.get("/health/container", async (_req: Request, res: Response) => {
  try {
    const report = await getContainerHealthReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo salud del contenedor.",
    });
  }
});

/**
 * POST /api/v1/tbit/health/reconcile
 * Reconcile container health (auto-repair)
 */
router.post("/health/reconcile", async (req: Request, res: Response) => {
  try {
    const dryRun = req.body?.dryRun === true;
    const report = await reconcileContainerHealth(dryRun);
    res.json(report);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo reconciliando indices del contenedor.",
    });
  }
});

export default router;
