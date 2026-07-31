import { Router, Request, Response } from "express";
import {
  rememberMemoryCompat,
  recallMemoryCompat,
  getMemoryContextCompat,
  getMemoryGraphCompat,
  getMemoryLinksCompat,
  deleteMemoryRecordCompat,
  deleteMemoryRecordsBatchCompat,
  rememberMemoryBatchCompat,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * POST /api/v1/tbit/memory/remember
 * Store a memory in the T-Bit container
 */
router.post("/memory/remember", async (req: Request, res: Response) => {
  try {
    const { userId, text, payload, key, domain, collection, tags, source, links } = req.body ?? {};

    if (typeof userId !== "string" || !userId.trim()) {
      res.status(400).json({ ok: false, error: "memory/remember requiere userId." });
      return;
    }

    const record = await rememberMemoryCompat({
      userId: userId.trim(),
      text: typeof text === "string" ? text : undefined,
      payload,
      key: typeof key === "string" ? key : undefined,
      domain: typeof domain === "string" ? domain : undefined,
      collection: typeof collection === "string" ? collection : undefined,
      tags: Array.isArray(tags) ? tags.filter((item) => typeof item === "string") : undefined,
      source: typeof source === "string" ? source : undefined,
      links: Array.isArray(links) ? links.filter((item) => typeof item === "string") : undefined,
    });

    res.json({ ok: true, record });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Memory Core remember.",
    });
  }
});

/**
 * POST /api/v1/tbit/memory/remember-batch
 * Store multiple memories in batch
 */
router.post("/memory/remember-batch", async (req: Request, res: Response) => {
  try {
    const { items } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, error: "remember-batch requiere items[]." });
      return;
    }

    const formatted = items.map((item) => ({
      userId: String(item.userId ?? "").trim(),
      text: typeof item.text === "string" ? item.text : undefined,
      payload: item.payload,
      key: typeof item.key === "string" ? item.key : undefined,
      domain: typeof item.domain === "string" ? item.domain : undefined,
      collection: typeof item.collection === "string" ? item.collection : undefined,
      tags: Array.isArray(item.tags) ? item.tags.filter((t: unknown) => typeof t === "string") : undefined,
      source: typeof item.source === "string" ? item.source : undefined,
      links: Array.isArray(item.links) ? item.links.filter((t: unknown) => typeof t === "string") : undefined,
    }));

    const records = await rememberMemoryBatchCompat(formatted);
    res.json({ ok: true, records });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Memory Core remember-batch.",
    });
  }
});

/**
 * POST /api/v1/tbit/memory/recall
 * Recall a memory by key
 */
router.post("/memory/recall", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "memory/recall requiere key." });
      return;
    }

    const record = await recallMemoryCompat(key.trim());
    res.json({ ok: true, record });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Memory Core recall.",
    });
  }
});

/**
 * POST /api/v1/tbit/memory/context
 * Get memory context for a user and query
 */
router.post("/memory/context", async (req: Request, res: Response) => {
  try {
    const { userId, query, limit } = req.body ?? {};

    if (typeof userId !== "string" || !userId.trim()) {
      res.status(400).json({ ok: false, error: "memory/context requiere userId." });
      return;
    }
    if (typeof query !== "string" || !query.trim()) {
      res.status(400).json({ ok: false, error: "memory/context requiere query." });
      return;
    }

    const context = await getMemoryContextCompat(userId.trim(), query.trim(), typeof limit === "number" ? limit : 8);
    res.json({ ok: true, context });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Memory Core context.",
    });
  }
});

/**
 * GET /api/v1/tbit/memory/graph
 * Get the memory graph for a user
 */
router.get("/memory/graph", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const graph = await getMemoryGraphCompat(typeof userId === "string" ? userId : undefined);
    res.json({ ok: true, graph });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Memory Core graph.",
    });
  }
});

/**
 * POST /api/v1/tbit/memory/links
 * Get memory links and backlinks
 */
router.post("/memory/links", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "memory/links requiere key." });
      return;
    }

    const links = await getMemoryLinksCompat(key.trim());
    res.json({ ok: true, links });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Memory Core links.",
    });
  }
});

/**
 * POST /api/v1/tbit/memory/delete
 * Delete a memory record
 */
router.post("/memory/delete", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "memory/delete requiere key." });
      return;
    }

    const result = await deleteMemoryRecordCompat(key.trim());
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Memory Core delete.",
    });
  }
});

/**
 * POST /api/v1/tbit/memory/delete-batch
 * Delete multiple memory records
 */
router.post("/memory/delete-batch", async (req: Request, res: Response) => {
  try {
    const { keys } = req.body ?? {};

    if (!Array.isArray(keys) || keys.length === 0) {
      res.status(400).json({ ok: false, error: "memory/delete-batch requiere keys[]." });
      return;
    }

    const results = await deleteMemoryRecordsBatchCompat(keys.map((k) => String(k).trim()));
    res.json({ ok: true, results });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Memory Core delete-batch.",
    });
  }
});

export default router;