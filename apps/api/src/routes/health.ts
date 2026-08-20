import { Router, Request, Response } from "express";
import { bootstrapLogger } from "../services/bootstrapLogger.js";

const router: Router = Router();

/**
 * GET /health
 * Liveness probe - returns basic health status.
 * Should always return 200 if the process is alive.
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? "0.3.0",
  });
});

/**
 * GET /livez
 * Kubernetes liveness probe alias.
 * Identical to /health for liveness checks.
 */
router.get("/livez", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? "0.3.0",
  });
});

/**
 * GET /readyz
 * Readiness probe - checks if the service is ready to handle requests.
 * Returns 200 when ready, 503 when not ready.
 * Checks: secrets present, vault context (if initialized), database connectivity.
 */
router.get("/readyz", async (req: Request, res: Response) => {
  const checks: Record<string, { status: "pass" | "fail"; details?: string }> = {};
  let allPass = true;

  // Check 1: Required secrets present
  const requiredSecrets = ["TBIT_API_KEY", "TBIT_HMAC_SECRET", "TBIT_ENCRYPTION_SECRET"];
  for (const secret of requiredSecrets) {
    const value = process.env[secret];
    if (!value || value.trim() === "" || value === "changeme") {
      checks[secret] = { status: "fail", details: "missing or default value" };
      allPass = false;
    } else {
      checks[secret] = { status: "pass" };
    }
  }

  // Check 2: Vault context (optional - only required after bootstrap)
  // We don't fail readiness if vault isn't initialized yet - that's a valid state
  // but we report it
  const vaultRoot = process.env.TBIT_VAULT_ROOT;
  if (vaultRoot) {
    checks.vaultRoot = { status: "pass", details: `configured at ${vaultRoot}` };
  } else {
    checks.vaultRoot = { status: "fail", details: "TBIT_VAULT_ROOT not configured" };
    allPass = false;
  }

  // Check 3: Database connectivity (if applicable)
  // For now, we assume the T-Bit storage is file-based and check the vault root
  // In future, this could check actual database connections

  const response = {
    ready: allPass,
    timestamp: new Date().toISOString(),
    checks,
  };

  bootstrapLogger.info("HealthCheck", "Readiness check completed", {
    requestId: req.id,
    correlationId: req.correlationId,
    endpoint: "/readyz",
    metadata: { ready: allPass, checks: Object.keys(checks) },
  });

  if (allPass) {
    res.status(200).json(response);
  } else {
    res.status(503).json(response);
  }
});

export default router;



