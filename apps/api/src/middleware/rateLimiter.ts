import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/**
 * Configuration for tiered rate limiting.
 * - Auth endpoints: stricter limit
 * - Vault init: moderate limit (bootstrap operation)
 * - Default API: standard limit
 */
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

/**
 * Default rate limit configurations per tier.
 */
const RATE_LIMIT_TIERS: Record<string, RateLimitConfig> = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: "Too many authentication attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  vaultInit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 vault init attempts per hour
    message: "Too many vault initialization attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
};

/**
 * Paths exempt from rate limiting.
 * These are critical bootstrap/setup paths that must remain accessible.
 */
const EXEMPT_PATHS = [
  "/setup/",
  "/vault/init",
  "/health",
  "/livez",
  "/readyz",
  "/metrics",
];

/**
 * Check if a request path should be exempt from rate limiting.
 */
function isExempt(path: string): boolean {
  return EXEMPT_PATHS.some((exempt) => path.startsWith(exempt));
}

/**
 * Determine the rate limit tier based on the request path.
 */
function getTierForPath(path: string): keyof typeof RATE_LIMIT_TIERS {
  if (path.startsWith("/api/v1/tbit/auth") || path.startsWith("/api/v1/tbit/login")) {
    return "auth";
  }
  if (path.startsWith("/api/v1/tbit/vault/init")) {
    return "vaultInit";
  }
  return "default";
}

/**
 * Internal rate limiter instance.
 * Type assertions used to bridge Express 4 (express-rate-limit) and Express 5 types.
 */
const rateLimiterInstance = rateLimit({
  // The key generator uses IP by default, but we customize to handle proxy headers
  keyGenerator: ((req: Request): string => {
    // Use X-Forwarded-For if behind proxy, otherwise IP
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]).trim();
    }
    return req.ip ?? "unknown";
  }) as any,
  // Skip rate limiting for exempt paths
  skip: ((req: Request): boolean => {
    return isExempt(req.path);
  }) as any,
  // Handler for rate limit exceeded
  handler: ((req: Request, res: Response): void => {
    const tier = getTierForPath(req.path);
    const config = RATE_LIMIT_TIERS[tier];
    res.status(429).json({
      ok: false,
      error: config.message,
      retryAfter: Math.ceil(config.windowMs / 1000),
    });
  }) as any,
  // Default configuration (used for non-exempt paths)
  windowMs: RATE_LIMIT_TIERS.default.windowMs,
  max: RATE_LIMIT_TIERS.default.max,
  message: RATE_LIMIT_TIERS.default.message,
  standardHeaders: RATE_LIMIT_TIERS.default.standardHeaders,
  legacyHeaders: RATE_LIMIT_TIERS.default.legacyHeaders,
});

/**
 * Rate limiter middleware.
 * Type assertion to bridge Express 4 (express-rate-limit) and Express 5 types.
 */
export function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  (rateLimiterInstance as any)(req, res, next);
}

/**
 * Export the instance for testing if needed.
 */
export { rateLimiterInstance as rateLimiter };