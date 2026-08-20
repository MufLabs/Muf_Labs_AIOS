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
  /**
   * Stage 10.2 — request lifecycle. Present on requestStart/requestEnd entries.
   */
  phase?: "request-start" | "request-end";
  statusCode?: number;
  durationMs?: number;
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

// ---------------------------------------------------------------------------
// Secret redaction (Stage 10.2)
//
// Dependency-free, zero-package scrubber applied to every emitted entry so no
// secret or sensitive header value can leak into structured logs regardless of
// the calling component. This satisfies the Phase 10 acceptance requirement:
// "Sensitive headers (x-tbit-api-key, Authorization) are redacted in logs."
//
// The redaction has two facets:
//   1. Metadata keys that are known secret/sensitive header names → value is
//      replaced with the literal placeholder.
//   2. Value strings that "look like" a secret (long hex / base64 blobs, or an
//      explicit key=value pair on a sensitive key) → redacted token-wise.
// ---------------------------------------------------------------------------

/** Literal placeholder substituted for any secret value. */
export const REDACTED = "[REDACTED]";

/**
 * Core alternation of sensitive key names (lower-cased matching is enabled by
 * the outer flags). Used to compose both the key-detection regex for metadata
 * and the explicit `key=value` scrubber for free-form strings.
 */
const SENSITIVE_KEY_ALTERNATION =
  "authorization|(?:x-)?(?:tbit-)?api[-_]?key|vite[-_]?tbit[-_]?api[-_]?key|" +
  "x-?api-?key|password|passwd|token|secret|hmac[-_]?secret|encryption[-_]?secret|" +
  "x-hmac-(?:secret|key)|cookie|set-?cookie|credential|refresh[-_]?token|access[-_]?token";

/**
 * Names (case-insensitive, matched loose) whose values must never be logged.
 * Covers the documented sensitive headers plus other known credential slots.
 */
const SENSITIVE_KEY_RE = new RegExp(
  `(^|[^a-z0-9])(${SENSITIVE_KEY_ALTERNATION})([^a-z0-9]|$)`,
  "i"
);

/** Strings that match this shape are treated as secret material (≥ 40 chars). */
const SECRET_SHAPED_VALUE_RE =
  /(?=[^ ])(?=.{40,})((?:[a-f0-9]{32,})|(?:[A-Za-z0-9+/=]{40,}(?![a-z])))/gi;

/** Explicit `sensitiveKey=value` pair inside a free-form string. */
const SECRET_KEY_VALUE_RE = new RegExp(
  `(^|[^a-z0-9])(${SENSITIVE_KEY_ALTERNATION})=([^\\s;,"']{8,})`,
  "ig"
);

function redactString(value: string): string {
  if (value.length === 0) return value;
  // Explicit sensitive key=value pairs -> redact the whole pair.
  const noPairs = value.replace(SECRET_KEY_VALUE_RE, (_whole, key) => `${key}=${REDACTED}`);
  // Secret-shaped blobs (long hex/base64) -> redact each match.
  return noPairs.replace(SECRET_SHAPED_VALUE_RE, REDACTED);
}

/**
 * Recursively redact a metadata value in place of secret material.
 * Plain scalar/boolean/null are returned unchanged; sensitive header keys and
 * secret-shaped string values are scrubbed.
 */
export function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Secret-named key -> scrub both the value and the key name itself.
      if (SENSITIVE_KEY_RE.test(k)) {
        result[REDACTED] = REDACTED;
        continue;
      }
      result[k] = redactValue(v);
    }
    return result;
  }
  return value;
}

/**
 * Apply redaction to every field of an entry that can carry free-form text so
 * that no secret leaks regardless of which logging method produced it.
 */
function redactEntry(entry: BootstrapLogEntry): BootstrapLogEntry {
  const next: BootstrapLogEntry = {
    ...entry,
    message: redactString(entry.message),
  };
  if (next.exception !== undefined) next.exception = redactString(next.exception);
  if (next.stackTrace !== undefined) next.stackTrace = redactString(next.stackTrace);
  if (next.metadata !== undefined) next.metadata = redactValue(next.metadata) as Record<string, unknown>;
  return next;
}

/**
 * Emit a structured bootstrap log entry to stdout.
 *
 * The entry is redacted (see `redactEntry`) and serialized as a single JSON
 * line so it can be parsed by any log shipper without line-splitting concerns.
 */
function emit(entry: BootstrapLogEntry): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(redactEntry(entry)));
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

  /**
   * Stage 10.2 — log the start of an HTTP request lifecycle.
   * Emits a structured `info` entry tagged with phase "request-start".
   * Consumed by observabilityMiddleware to record when a request begins.
   */
  requestStart(
    component: string,
    message: string,
    ctx: RequestLifecycleContext = {}
  ): void {
    emit({
      timestamp: new Date().toISOString(),
      requestId: ctx.requestId ?? "—",
      correlationId: ctx.correlationId ?? "—",
      component,
      endpoint: ctx.endpoint ?? "—",
      level: "info",
      message,
      phase: "request-start",
      metadata: ctx.metadata,
    });
  },

  /**
   * Stage 10.2 — log the completion of an HTTP request lifecycle.
   * Emits a structured `info` entry tagged with phase "request-end" and includes
   * the HTTP status code and total duration (ms). Consumed by
   * observabilityMiddleware on the response "finish" event.
   */
  requestEnd(
    component: string,
    message: string,
    ctx: RequestLifecycleContext = {}
  ): void {
    emit({
      timestamp: new Date().toISOString(),
      requestId: ctx.requestId ?? "—",
      correlationId: ctx.correlationId ?? "—",
      component,
      endpoint: ctx.endpoint ?? "—",
      level: "info",
      message,
      phase: "request-end",
      statusCode: ctx.statusCode,
      durationMs: ctx.durationMs,
      metadata: ctx.metadata,
    });
  },
};

/**
 * Convenience type for the generic log context used by info/warn/error.
 */
export type BootstrapLogContext = {
  requestId?: string;
  correlationId?: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Context accepted by requestStart/requestEnd (Stage 10.2 request lifecycle).
 * Extends the generic context with HTTP response fields recorded on completion.
 */
export type RequestLifecycleContext = {
  requestId?: string;
  correlationId?: string;
  endpoint?: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};
