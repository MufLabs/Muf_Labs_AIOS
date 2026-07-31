import { Router, Request, Response } from "express";
import {
  searchQueryIndex,
  rebuildQueryIndex,
  syncQueryIndexIncremental,
  getQueryIndex,
  getQueryIndexStats,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/query/stats
 * Get query index statistics
 */
router.get("/query/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getQueryIndexStats();
    res.json({ ok: true, stats });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo Query Index.",
    });
  }
});

/**
 * POST /api/v1/tbit/query/rebuild
 * Rebuild query index from scratch
 */
router.post("/query/rebuild", async (_req: Request, res: Response) => {
  try {
    const index = await rebuildQueryIndex();
    res.json({
      ok: true,
      index: {
        builtAt: index.builtAt,
        totalRecords: index.totalRecords,
        users: Object.keys(index.byUser).length,
        sources: Object.keys(index.bySource).length,
        tags: Object.keys(index.byTag).length,
        tokens: Object.keys(index.byToken).length,
        documents: Object.keys(index.byDocument).length,
        attributes: Object.keys(index.byAttribute).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo reconstruyendo Query Index.",
    });
  }
});

/**
 * POST /api/v1/tbit/query/sync
 * Incremental sync of query index
 */
router.post("/query/sync", async (_req: Request, res: Response) => {
  try {
    const index = await syncQueryIndexIncremental();
    res.json({
      ok: true,
      index: {
        builtAt: index.builtAt,
        totalRecords: index.totalRecords,
        users: Object.keys(index.byUser).length,
        sources: Object.keys(index.bySource).length,
        tags: Object.keys(index.byTag).length,
        tokens: Object.keys(index.byToken).length,
        documents: Object.keys(index.byDocument).length,
        attributes: Object.keys(index.byAttribute).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo sincronizando Query Index.",
    });
  }
});

/**
 * POST /api/v1/tbit/query/search
 * Search in query index
 */
router.post("/query/search", async (req: Request, res: Response) => {
  try {
    const result = await searchQueryIndex(req.body ?? {});
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo buscando en Query Index.",
    });
  }
});

/**
 * GET /api/v1/tbit/query
 * Get full query index (debug/admin)
 */
router.get("/query", async (_req: Request, res: Response) => {
  try {
    const index = await getQueryIndex();
    res.json({ ok: true, index });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo Query Index completo.",
    });
  }
});

export default router;