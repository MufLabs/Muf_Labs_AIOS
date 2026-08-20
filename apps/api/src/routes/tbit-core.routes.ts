import { Router, Request, Response } from "express";
import {
  injectMemory,
  injectManyMemories,
  recoverData,
  collapseMemory,
  collapseManyMemories,
  snapshotContainer,
  rollbackContainer,
  getContainerStats,
  readAllPayloads,
  exportBundle,
  importBundle,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth.js";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * POST /api/v1/tbit/inject
 * Inject a single memory into the T-Bit container
 */
router.post("/inject", async (req: Request, res: Response) => {
  try {
    const { key, payload, tags, source, userId } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "inject requiere key." });
      return;
    }
    if (typeof payload !== "string" || !payload.trim()) {
      res.status(400).json({ ok: false, error: "inject requiere payload." });
      return;
    }

    const result = await injectMemory(key.trim(), payload.trim(), tags, source, userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en inject.",
    });
  }
});

/**
 * POST /api/v1/tbit/inject-many
 * Inject multiple memories in batch
 */
router.post("/inject-many", async (req: Request, res: Response) => {
  try {
    const { items } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, error: "inject-many requiere items[]." });
      return;
    }

    const formatted = items.map((item: { key?: unknown; payload?: unknown; tags?: unknown; source?: unknown; userId?: unknown }) => ({
      key: String(item.key ?? "").trim(),
      payload: String(item.payload ?? "").trim(),
      tags: Array.isArray(item.tags)
        ? item.tags.filter((t): t is string => typeof t === "string")
        : undefined,
      source: typeof item.source === "string" ? item.source : undefined,
      userId: typeof item.userId === "string" ? item.userId : undefined,
    }));

    const result = await injectManyMemories(formatted);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en inject-many.",
    });
  }
});

/**
 * POST /api/v1/tbit/recover
 * Recover data by key
 */
router.post("/recover", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "recover requiere key." });
      return;
    }

    const result = await recoverData(key.trim());
    if (!result) {
      res.status(404).json({ ok: false, error: "Clave no encontrada." });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en recover.",
    });
  }
});

/**
 * POST /api/v1/tbit/collapse
 * Collapse (consolidate) a memory
 */
router.post("/collapse", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "collapse requiere key." });
      return;
    }

    const result = await collapseMemory(key.trim());
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en collapse.",
    });
  }
});

/**
 * POST /api/v1/tbit/collapse-many
 * Collapse multiple memories
 */
router.post("/collapse-many", async (req: Request, res: Response) => {
  try {
    const { keys } = req.body ?? {};

    if (!Array.isArray(keys) || keys.length === 0) {
      res.status(400).json({ ok: false, error: "collapse-many requiere keys[]." });
      return;
    }

    const result = await collapseManyMemories(keys.map((k) => String(k).trim()));
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en collapse-many.",
    });
  }
});

/**
 * POST /api/v1/tbit/snapshot
 * Create snapshot of container
 */
router.post("/snapshot", async (_req: Request, res: Response) => {
  try {
    const result = await snapshotContainer();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en snapshot.",
    });
  }
});

/**
 * POST /api/v1/tbit/rollback
 * Rollback to snapshot
 */
router.post("/rollback", async (req: Request, res: Response) => {
  try {
    const { snapshotId } = req.body ?? {};

    if (typeof snapshotId !== "string" || !snapshotId.trim()) {
      res.status(400).json({ ok: false, error: "rollback requiere snapshotId." });
      return;
    }

    const result = await rollbackContainer(snapshotId.trim());
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en rollback.",
    });
  }
});

/**
 * GET /api/v1/tbit/stats
 * Get container statistics
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const result = await getContainerStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo obteniendo stats.",
    });
  }
});

/**
 * GET /api/v1/tbit/payloads
 * Read all payloads (debug/admin)
 */
router.get("/payloads", async (_req: Request, res: Response) => {
  try {
    const result = await readAllPayloads();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo payloads.",
    });
  }
});

/**
 * POST /api/v1/tbit/export
 * Export container bundle
 */
router.post("/export", async (req: Request, res: Response) => {
  try {
    const { includeSnapshots, includeWal } = req.body ?? {};
    const result = await exportBundle(undefined, {
      includeSnapshots: Boolean(includeSnapshots),
      includeWal: Boolean(includeWal),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en export.",
    });
  }
});

/**
 * POST /api/v1/tbit/import
 * Import container bundle
 */
router.post("/import", async (req: Request, res: Response) => {
  try {
    const { bundleId } = req.body ?? {};

    if (!bundleId || typeof bundleId !== "string") {
      res.status(400).json({ ok: false, error: "import requiere bundleId." });
      return;
    }

    const result = await importBundle(bundleId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en import.",
    });
  }
});

export default router;
