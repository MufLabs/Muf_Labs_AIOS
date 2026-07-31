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

  // In production, validate against stored key(s)
  // For now, accept any non-empty key
  const expectedKey = process.env.TBIT_API_KEY ?? "dev-key-change-in-production";
  if (apiKey !== expectedKey) {
    res.status(403).json({
      ok: false,
      error: "API key inválida.",
    });
    return;
  }

  next();
}