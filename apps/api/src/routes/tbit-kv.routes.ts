import { Router, Request, Response } from "express";
import {
  getKvValue,
  setKvValue,
  deleteKvValue,
  listKvKeys,
  getKvStats,
  KvValueOptions,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/kv/:key
 * Get KV value by key
 */
router.get("/kv/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "kv get requiere key." });
      return;
    }

    const value = await getKvValue(key.trim());
    if (value === null) {
      res.status(404).json({ ok: false, error: "Key no encontrada." });
      return;
    }

    res.json({ ok: true, key: key.trim(), value });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo KV.",
    });
  }
});

/**
 * POST /api/v1/tbit/kv
 * Set KV value
 */
router.post("/kv", async (req: Request, res: Response) => {
  try {
    const { key, value, ttl, type } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "kv set requiere key." });
      return;
    }
    if (value === undefined || value === null) {
      res.status(400).json({ ok: false, error: "kv set requiere value." });
      return;
    }

    const options: KvValueOptions = {
      ttl: typeof ttl === "number" && ttl > 0 ? ttl : undefined,
      type: typeof type === "string" ? type : undefined,
    };

    await setKvValue(key.trim(), value, options);
    res.status(201).json({ ok: true, key: key.trim() });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo escribiendo KV.",
    });
  }
});

/**
 * DELETE /api/v1/tbit/kv/:key
 * Delete KV value
 */
router.delete("/kv/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "kv delete requiere key." });
      return;
    }

    await deleteKvValue(key.trim());
    res.json({ ok: true, key: key.trim() });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo eliminando KV.",
    });
  }
});

/**
 * GET /api/v1/tbit/kv
 * List KV keys (with optional prefix filter)
 */
router.get("/kv", async (req: Request, res: Response) => {
  try {
    const prefix = typeof req.query.prefix === "string" ? req.query.prefix : undefined;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;
    const keys = await listKvKeys(prefix, limit);
    res.json({ ok: true, keys });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo listando KV.",
    });
  }
});

/**
 * GET /api/v1/tbit/kv/stats
 * Get KV statistics
 */
router.get("/kv/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getKvStats();
    res.json({ ok: true, stats });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo obteniendo stats KV.",
    });
  }
});

export default router;