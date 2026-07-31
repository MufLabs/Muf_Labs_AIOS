import { Router, Request, Response } from "express";
import {
  getAiPermissionsPolicy,
  updateAiPermissionsPolicy,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/ai/permissions
 * Get AI permissions policy
 */
router.get("/ai/permissions", async (_req: Request, res: Response) => {
  try {
    const policy = await getAiPermissionsPolicy();
    res.json({ ok: true, policy });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo permisos IA.",
    });
  }
});

/**
 * POST /api/v1/tbit/ai/permissions
 * Update AI permissions policy
 */
router.post("/ai/permissions", async (req: Request, res: Response) => {
  try {
    const policy = await updateAiPermissionsPolicy(req.body ?? {});
    res.json({ ok: true, policy });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo actualizando permisos IA.",
    });
  }
});

export default router;