import { Router, Request, Response } from "express";
import {
  getNetworkState,
  exportNetworkRecord,
  importNetworkRecord,
  compareNetworkState,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/network/state
 * Get network state for anti-entropy/sync
 */
router.get("/network/state", async (_req: Request, res: Response) => {
  try {
    const state = await getNetworkState();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(state);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo al consultar estado anti-entropia.",
    });
  }
});

/**
 * POST /api/v1/tbit/network/export-record
 * Export a single network record
 */
router.post("/network/export-record", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "export-record requiere key." });
      return;
    }

    const record = await exportNetworkRecord(key.trim());
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(record);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo al exportar registro T-BIT.",
    });
  }
});

/**
 * POST /api/v1/tbit/network/import-record
 * Import a network record
 */
router.post("/network/import-record", async (req: Request, res: Response) => {
  try {
    const { key, payload, checksum, networkSignature, networkKeyId, sourceNodeId, updatedAt, force } = req.body ?? {};

    if (typeof key !== "string" || typeof payload !== "string" || typeof checksum !== "string") {
      res.status(400).json({ ok: false, error: "import-record requiere key, payload y checksum." });
      return;
    }

    const result = await importNetworkRecord({
      key: key.trim(),
      payload: payload.trim(),
      checksum: checksum.trim(),
      networkSignature: typeof networkSignature === "string" ? networkSignature : undefined,
      networkKeyId: typeof networkKeyId === "string" ? networkKeyId : undefined,
      sourceNodeId: typeof sourceNodeId === "string" ? sourceNodeId : undefined,
      updatedAt: typeof updatedAt === "string" ? updatedAt : undefined,
      force: Boolean(force),
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo al importar registro T-BIT.",
    });
  }
});

/**
 * POST /api/v1/tbit/network/compare
 * Compare network state with remote
 */
router.post("/network/compare", async (req: Request, res: Response) => {
  try {
    const { remoteState } = req.body ?? {};

    if (!remoteState || typeof remoteState !== "object") {
      res.status(400).json({ ok: false, error: "compare requiere remoteState." });
      return;
    }

    const comparison = await compareNetworkState(remoteState);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(comparison);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo al comparar estado de red.",
    });
  }
});

export default router;
