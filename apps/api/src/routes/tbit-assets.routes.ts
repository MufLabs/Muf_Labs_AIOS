import { Router, Request, Response } from "express";
import {
  listAssetsCompat,
  getAssetStatsCompat,
  deleteAssetCompat,
  reconstructBinaryAssetCompat,
  deleteBinaryAssetCompat,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth.js";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/assets
 * List all assets (optionally filtered by userId)
 */
router.get("/assets", async (req: Request, res: Response) => {
  try {
    const userId = typeof req.query.userId === "string" && req.query.userId.trim()
      ? req.query.userId.trim()
      : undefined;
    const assets = await listAssetsCompat(userId);
    res.json({ ok: true, assets });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo listando assets.",
    });
  }
});

/**
 * GET /api/v1/tbit/assets/stats
 * Get asset statistics
 */
router.get("/assets/stats", async (req: Request, res: Response) => {
  try {
    const userId = typeof req.query.userId === "string" && req.query.userId.trim()
      ? req.query.userId.trim()
      : undefined;
    const stats = await getAssetStatsCompat(userId);
    res.json({ ok: true, stats });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo estado de assets.",
    });
  }
});

/**
 * DELETE /api/v1/tbit/assets/:key
 * Delete an asset by key
 */
router.delete("/assets/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "assets/delete requiere assetKey." });
      return;
    }

    const result = await deleteAssetCompat(key.trim());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo eliminando asset.",
    });
  }
});

/**
 * POST /api/v1/tbit/assets/reconstruct-binary
 * Reconstruct binary asset from container
 */
router.post("/assets/reconstruct-binary", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "assets/reconstruct-binary requiere key." });
      return;
    }

    const result = await reconstructBinaryAssetCompat(key.trim());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo reconstruyendo asset binario.",
    });
  }
});

/**
 * POST /api/v1/tbit/assets/delete-binary
 * Delete binary asset from container
 */
router.post("/assets/delete-binary", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "assets/delete-binary requiere key." });
      return;
    }

    const result = await deleteBinaryAssetCompat(key.trim());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo eliminando asset binario.",
    });
  }
});

export default router;
