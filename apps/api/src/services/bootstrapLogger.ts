import { randomUUID } from "crypto";

/**
 * ECR-Phase9-0001 — FR-07: Structured Bootstrap Logging.
 *
 * Every bootstrap failure shall generate structured logs including:
 *  - Timestamp
 *  - Request ID
 *  - Component
 *  - Exception
 *  - Stack trace
 *  - Endpoint
 *  - Correlation ID
 *
 * The logger writes structured JSON lines to the console (stdout) so they
 * can be ingested by any log aggregator (OpenTelemetry, Loki, Datadog, …).
 * It is intentionally dependency-free to avoid coupling the bootstrap
 * stabilization gate to any external observability vendor.
 */

export interface BootstrapLogEntry {
  timestamp: string;
  requestId: string;
  correlationId: string;
  component: string;
  endpoint: string;
  level: "info" | "warn" | "error";
  message: string;
  exception?: string;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generate a fresh request id (UUID v4).
 */
export function newRequestId(): string {
  return randomUUID();
}

/**
 * Generate a fresh correlation id (UUID v4).
 * Correlation ids link a single logical bootstrap operation across
 * multiple log lines (vault init → kernel init → provider fan-out).
 */
export function newCorrelationId(): string {
  return randomUUID();
}

/**
 * Emit a structured bootstrap log entry to stdout.
 *
 * The entry is serialized as a single JSON line so it can be parsed by
 * any log shipper without line-splitting concerns.
 */
function emit(entry: BootstrapLogEntry): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

/**
 * Bootstrap logger — stabilized surface for ECR-Phase9-0001 FR-07.
 *
 * Use `logger.info` for successful lifecycle events, `logger.warn` for
 * recoverable issues, and `logger.error` for bootstrap failures that
 * prevent the workflow from completing. Every `error` call includes the
 * exception name and stack trace so developers can triage without
 * reproducing locally.
 */
export const bootstrapLogger = {
  info(component: string, message: string, ctx: { requestId?: string; correlationId?: string; endpoint?: string; metadata?: Record<string, unknown> } = {}): void {
    emit({
      timestamp: new Date().toISOString(),
      requestId: ctx.requestId ?? "—",
      correlationId: ctx.correlationId ?? "—",
      component,
      endpoint: ctx.endpoint ?? "—",
      level: "info",
      message,
      metadata: ctx.metadata,
    });
  },

  warn(component: string, message: string, ctx: { requestId?: string; correlationId?: string; endpoint?: string; metadata?: Record<string, unknown> } = {}): void {
    emit({
      timestamp: new Date().toISOString(),
      requestId: ctx.requestId ?? "—",
      correlationId: ctx.correlationId ?? "—",
      component,
      endpoint: ctx.endpoint ?? "—",
      level: "warn",
      message,
      metadata: ctx.metadata,
    });
  },

  error(
    component: string,
    message: string,
    error: unknown,
    ctx: { requestId?: string; correlationId?: string; endpoint?: string; metadata?: Record<string, unknown> } = {}
  ): void {
    const err =
      error instanceof Error
        ? error
        : typeof error === "string"
          ? new Error(error)
          : new Error("Unknown error");
    emit({
      timestamp: new Date().toISOString(),
      requestId: ctx.requestId ?? "—",
      correlationId: ctx.correlationId ?? "—",
      component,
      endpoint: ctx.endpoint ?? "—",
      level: "error",
      message,
      exception: err.name,
      stackTrace: err.stack ?? "",
      metadata: ctx.metadata,
    });
  },
};

/**
 * Convenience type re-export for consumers that want to type their
 * log context inline.
 */
export type BootstrapLogContext = {
  requestId?: string;
  correlationId?: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
};
