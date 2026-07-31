import { Router, Request, Response } from "express";
import {
  getEncryptionKeyStatus,
  getEncryptionKeyRing,
  getActiveEncryptionKey,
} from "@muf/tbit-core";

import { requireSymbolicApiKey } from "../middleware/auth";

const router: Router = Router();

// All routes in this module require API key authentication
router.use(requireSymbolicApiKey);

/**
 * GET /api/v1/tbit/encryption
 * Get encryption key status
 */
router.get("/encryption", async (_req: Request, res: Response) => {
  try {
    const status = getEncryptionKeyStatus();
    res.json({ ok: true, status });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo estado de cifrado.",
    });
  }
});

/**
 * GET /api/v1/tbit/encryption/keys
 * Get encryption key ring
 */
router.get("/encryption/keys", async (_req: Request, res: Response) => {
  try {
    const ring = getEncryptionKeyRing();
    res.json({ ok: true, keys: ring });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo leyendo anillo de llaves.",
    });
  }
});

/**
 * GET /api/v1/tbit/encryption/active
 * Get active encryption key
 */
router.get("/encryption/active", async (_req: Request, res: Response) => {
  try {
    const key = getActiveEncryptionKey();
    res.json({ ok: true, key });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo obteniendo llave activa.",
    });
  }
});

export default router;