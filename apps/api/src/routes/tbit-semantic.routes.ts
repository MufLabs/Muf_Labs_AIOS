import { Router, Request, Response } from "express";
import {
  getSemanticIndexStats,
  rebuildSemanticIndex,
  searchSemanticIndex,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/semantic/stats
 * Get semantic index statistics
 */
router.get("/semantic/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getSemanticIndexStats();
    res.json({ ok: true, stats });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo Semantic Index.",
    });
  }
});

/**
 * POST /api/v1/tbit/semantic/rebuild
 * Rebuild semantic index from scratch
 */
router.post("/semantic/rebuild", async (_req: Request, res: Response) => {
  try {
    const index = await rebuildSemanticIndex();
    res.json({
      ok: true,
      index: {
        builtAt: index.builtAt,
        totalRecords: Object.keys(index.entries).length,
        model: index.model,
        dimensions: index.dimensions,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo reconstruyendo Semantic Index.",
    });
  }
});

/**
 * POST /api/v1/tbit/semantic/search
 * Search in semantic index
 */
router.post("/semantic/search", async (req: Request, res: Response) => {
  try {
    const result = await searchSemanticIndex(req.body ?? {});
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo buscando semanticamente.",
    });
  }
});

export default router;