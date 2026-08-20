import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { bootstrapLogger, newCorrelationId } from "../services/bootstrapLogger.js";

/**
 * Extend Express Request type to include request ID and correlation ID.
 */
declare global {
  namespace Express {
    interface Request {
      id: string;
      correlationId: string;
    }
  }
}

/**
 * Header names for request/correlation ID propagation.
 */
export const REQUEST_ID_HEADER = "x-request-id";
export const CORRELATION_ID_HEADER = "x-correlation-id";

/**
 * Request ID middleware.
 * - Reads X-Request-Id header or generates UUID v4
 * - Sets req.id for downstream use
 * - Adds X-Request-Id to response headers
 * - Generates/propagates correlation ID
 * Note: Request lifecycle logging is handled by observabilityMiddleware.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract or generate request ID
  const incomingRequestId = req.headers[REQUEST_ID_HEADER];
  const requestId = typeof incomingRequestId === "string" ? incomingRequestId : randomUUID();

  // Extract or generate correlation ID
  const incomingCorrelationId = req.headers[CORRELATION_ID_HEADER];
  const correlationId = typeof incomingCorrelationId === "string" ? incomingCorrelationId : newCorrelationId();

  // Attach to request object for downstream middleware/routes
  req.id = requestId;
  req.correlationId = correlationId;

  // Add to response headers for client-side tracing
  res.setHeader(REQUEST_ID_HEADER, requestId);
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  // Store start time for duration calculation (used by observability middleware)
  (req as Request & { _startTime?: number })._startTime = Date.now();

  next();
}

/**
 * Factory function for creating the middleware (allows future config).
 */
export function createRequestIdMiddleware(): typeof requestIdMiddleware {
  return requestIdMiddleware;
}


