import { Request, Response, NextFunction } from "express";

/**
 * Middleware to require symbolic API key for T-Bit endpoints
 * Expects header: x-tbit-api-key
 */
export function requireSymbolicApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers["x-tbit-api-key"];

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    res.status(401).json({
      ok: false,
      error: "Se requiere cabecera x-tbit-api-key.",
    });
    return;
  }

  // Resolve the expected key strictly from the environment (installation-level).
  // No hardcoded fallback: if the canonical root .env has not been bootstrapped,
  // authentication fails closed instead of accepting a default value.
  const expectedKey = process.env.TBIT_API_KEY;
  if (!expectedKey || expectedKey.trim().length === 0) {
    res.status(503).json({
      ok: false,
      error: "API key local no configurada. Ejecuta el bootstrap de secretos (pnpm run setup:secret).",
    });
    return;
  }

  if (apiKey !== expectedKey) {
    res.status(403).json({
      ok: false,
      error: "API key inválida.",
    });
    return;
  }

  next();
}