import { Request, Response, NextFunction } from "express";
import { bootstrapLogger } from "../services/bootstrapLogger.js";
import { recordHttpRequest } from "../services/metrics.js";

/**
 * Observability middleware.
 * Wraps bootstrapLogger.requestStart/End to log request lifecycle.
 * Adds X-Request-Id and X-Correlation-Id to response headers.
 * Logs latency, status code, method, path.
 * Records metrics via recordHttpRequest().
 * Integrates with requestIdMiddleware from Stage 10.1.
 */
export function observabilityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = req.id;
  const correlationId = req.correlationId;
  const endpoint = `${req.method} ${req.originalUrl ?? req.url}`;

  // Log request start
  bootstrapLogger.requestStart("ObservabilityMiddleware", "Request started", {
    requestId,
    correlationId,
    endpoint,
    metadata: {
      method: req.method,
      url: req.originalUrl ?? req.url,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  // Ensure response headers include request/correlation IDs
  res.setHeader("x-request-id", requestId);
  res.setHeader("x-correlation-id", correlationId);

  // Log request completion on finish
  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    bootstrapLogger.requestEnd("ObservabilityMiddleware", "Request completed", {
      requestId,
      correlationId,
      endpoint,
      statusCode,
      durationMs,
      metadata: {
        method: req.method,
        url: req.originalUrl ?? req.url,
      },
    });

    // Record HTTP request metrics
    recordHttpRequest(req.method, req.originalUrl ?? req.url, statusCode, durationMs);
  });

  next();
}

/**
 * Factory function for creating the middleware (allows future config).
 */
export function createObservabilityMiddleware(): typeof observabilityMiddleware {
  return observabilityMiddleware;
}


