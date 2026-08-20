import { Router, Request, Response } from "express";
import {
  importMarkdownDocumentCompat,
  reconstructMarkdownDocumentCompat,
  listMarkdownDocumentsCompat,
  deleteMarkdownDocumentCompat,
  purgeOrphanMarkdownChunksCompat,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth.js";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * POST /api/v1/tbit/markdown/import
 * Import markdown document
 */
router.post("/markdown/import", async (req: Request, res: Response) => {
  try {
    const { userId, filename, content, key } = req.body ?? {};

    if (typeof userId !== "string" || typeof filename !== "string" || typeof content !== "string") {
      res.status(400).json({ ok: false, error: "markdown/import requiere userId, filename y content." });
      return;
    }

    const result = await importMarkdownDocumentCompat({
      userId,
      filename,
      content,
      key: typeof key === "string" ? key : undefined,
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Markdown import.",
    });
  }
});

/**
 * POST /api/v1/tbit/markdown/reconstruct
 * Reconstruct markdown document from container
 */
router.post("/markdown/reconstruct", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "markdown/reconstruct requiere key." });
      return;
    }

    const result = await reconstructMarkdownDocumentCompat(key.trim());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo reconstruyendo Markdown.",
    });
  }
});

/**
 * GET /api/v1/tbit/markdown/list
 * List markdown documents
 */
router.get("/markdown/list", async (req: Request, res: Response) => {
  try {
    const userId = typeof req.query.userId === "string" && req.query.userId.trim()
      ? req.query.userId.trim()
      : undefined;
    const documents = await listMarkdownDocumentsCompat(userId);
    res.json({ ok: true, documents });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo listando documentos Markdown.",
    });
  }
});

/**
 * POST /api/v1/tbit/markdown/delete
 * Delete markdown document
 */
router.post("/markdown/delete", async (req: Request, res: Response) => {
  try {
    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      res.status(400).json({ ok: false, error: "markdown/delete requiere key." });
      return;
    }

    const result = await deleteMarkdownDocumentCompat(key.trim());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo eliminando documento Markdown.",
    });
  }
});

/**
 * POST /api/v1/tbit/markdown/purge-orphans
 * Purge orphan markdown chunks
 */
router.post("/markdown/purge-orphans", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body ?? {};
    const result = await purgeOrphanMarkdownChunksCompat(
      typeof userId === "string" && userId.trim() ? userId.trim() : undefined
    );
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo purgando chunks huérfanos de Markdown.",
    });
  }
});

export default router;
