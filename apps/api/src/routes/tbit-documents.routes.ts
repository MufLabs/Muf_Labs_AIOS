import { Router, Request, Response } from "express";
import {
  importUniversalDocumentCompat,
  answerDocumentQuestionCompat,
  importBinaryAssetCompat,
  importMarkdownDocumentCompat,
  parseMarkdownDocumentCompat,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * POST /api/v1/tbit/documents/import
 * Import universal document (PDF, DOCX, XLSX, etc.)
 */
router.post("/documents/import", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      filename,
      mimeType,
      contentBase64,
      key,
      semanticMode,
      analyzeCode,
      showCodeGraphRelations,
    } = req.body ?? {};

    if (typeof userId !== "string" || typeof filename !== "string" || typeof contentBase64 !== "string") {
      res.status(400).json({ ok: false, error: "documents/import requiere userId, filename y contentBase64." });
      return;
    }

    const result = await importUniversalDocumentCompat({
      userId,
      filename,
      mimeType: typeof mimeType === "string" ? mimeType : undefined,
      contentBase64,
      key: typeof key === "string" ? key : undefined,
      semanticMode: semanticMode === "inline" || semanticMode === "deferred" || semanticMode === "skip"
        ? semanticMode
        : "auto",
      analyzeCode: typeof analyzeCode === "boolean" ? analyzeCode : undefined,
      showCodeGraphRelations: typeof showCodeGraphRelations === "boolean" ? showCodeGraphRelations : undefined,
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo importando documento universal.",
    });
  }
});

/**
 * POST /api/v1/tbit/document/ask
 * Ask a question about a document
 */
router.post("/document/ask", async (req: Request, res: Response) => {
  try {
    const { query, userId, document, key, limit } = req.body ?? {};

    if (typeof query !== "string" || !query.trim()) {
      res.status(400).json({ ok: false, error: "document/ask requiere query." });
      return;
    }

    const result = await answerDocumentQuestionCompat({
      query,
      userId: typeof userId === "string" && userId.trim() ? userId : undefined,
      document: typeof document === "string" && document.trim() ? document : undefined,
      key: typeof key === "string" && key.trim() ? key : undefined,
      limit: typeof limit === "number" ? limit : undefined,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo respondiendo pregunta documental.",
    });
  }
});

/**
 * POST /api/v1/tbit/assets/import-binary
 * Import binary asset
 */
router.post("/assets/import-binary", async (req: Request, res: Response) => {
  try {
    const { userId, filename, mimeType, contentBase64, key } = req.body ?? {};

    if (typeof userId !== "string" || typeof filename !== "string" || typeof contentBase64 !== "string") {
      res.status(400).json({ ok: false, error: "assets/import-binary requiere userId, filename y contentBase64." });
      return;
    }

    const result = await importBinaryAssetCompat({
      userId,
      filename,
      mimeType: typeof mimeType === "string" ? mimeType : undefined,
      contentBase64,
      key: typeof key === "string" ? key : undefined,
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo importando asset binario.",
    });
  }
});

/**
 * POST /api/v1/tbit/assets/import-markdown
 * Import markdown file
 */
router.post("/assets/import-markdown", async (req: Request, res: Response) => {
  try {
    const { userId, filename, content, key } = req.body ?? {};

    if (typeof userId !== "string" || typeof filename !== "string" || typeof content !== "string") {
      res.status(400).json({ ok: false, error: "assets/import-markdown requiere userId, filename y content." });
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
      error: error instanceof Error ? error.message : "Fallo importando Markdown.",
    });
  }
});

/**
 * POST /api/v1/tbit/markdown/preview
 * Preview markdown without importing
 */
router.post("/markdown/preview", async (req: Request, res: Response) => {
  try {
    const { userId, filename, content, key } = req.body ?? {};

    if (typeof userId !== "string" || typeof filename !== "string" || typeof content !== "string") {
      res.status(400).json({ ok: false, error: "markdown/preview requiere userId, filename y content." });
      return;
    }

    const parsed = parseMarkdownDocumentCompat({
      userId,
      filename,
      content,
      key: typeof key === "string" ? key : undefined,
    });

    res.json({ ok: true, parsed });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo en Markdown preview.",
    });
  }
});

export default router;