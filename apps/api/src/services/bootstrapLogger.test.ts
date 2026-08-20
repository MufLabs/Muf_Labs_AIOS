import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { bootstrapLogger, newRequestId, newCorrelationId, REDACTED } from "./bootstrapLogger";

/**
 * ECR-Phase9-0001 — FR-07 structured bootstrap logging unit tests.
 *
 * Verifies that every emitted log line includes the required fields:
 *  Timestamp, Request ID, Component, Exception, Stack trace, Endpoint,
 *  Correlation ID.
 */

function captureLog(): { lines: string[]; spy: MockInstance } {
  const lines: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((line: string) => {
    lines.push(line);
  }) as MockInstance;
  return { lines, spy };
}

describe("bootstrapLogger (ECR-Phase9-0001 FR-07)", () => {
  let originalErrorLog: typeof console.log;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits a structured info log with all required fields", () => {
    const { lines, spy } = captureLog();

    bootstrapLogger.info("VaultBootstrapRoute", "Vault initialized successfully.", {
      requestId: "req-1",
      correlationId: "corr-1",
      endpoint: "POST /api/v1/tbit/vault/init",
      metadata: { kernelReady: true },
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.component).toBe("VaultBootstrapRoute");
    expect(entry.message).toBe("Vault initialized successfully.");
    expect(entry.requestId).toBe("req-1");
    expect(entry.correlationId).toBe("corr-1");
    expect(entry.endpoint).toBe("POST /api/v1/tbit/vault/init");
    expect(entry.level).toBe("info");
    expect(typeof entry.timestamp).toBe("string");
    expect(new Date(entry.timestamp as string).toString()).not.toBe("Invalid Date");
    // metadata is preserved
    expect(entry.metadata).toMatchObject({ kernelReady: true });
  });

  it("emits an error log with exception name and stack trace", () => {
    const { lines, spy } = captureLog();
    const boom = new Error("vault init failed");

    bootstrapLogger.error("VaultBootstrapRoute", "Vault initialization failed.", boom, {
      requestId: "req-2",
      correlationId: "corr-2",
      endpoint: "POST /api/v1/tbit/vault/init",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.level).toBe("error");
    expect(entry.exception).toBe("Error");
    expect(entry.stackTrace).toContain("Error: vault init failed");
    expect(entry.requestId).toBe("req-2");
    expect(entry.correlationId).toBe("corr-2");
  });

  it("coerces a string error into an Error with exception metadata", () => {
    const { lines } = captureLog();

    bootstrapLogger.error("SetupRoute", "Failed querying setup status.", "boom-string", {
      requestId: "req-3",
    });

    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.exception).toBe("Error");
    expect(entry.message).toBe("Failed querying setup status.");
  });

  it("generates unique request and correlation ids", () => {
    const a = newRequestId();
    const b = newRequestId();
    const c = newCorrelationId();
    const d = newCorrelationId();

    expect(a).not.toBe(b);
    expect(c).not.toBe(d);
    expect(a).toMatch(/^[0-9a-f-]{36}$/i);
    expect(c).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("produces parseable JSON lines for each log entry (log shipper friendly)", () => {
    const { lines, spy } = captureLog();

    bootstrapLogger.info("A", "one", { requestId: "r1" });
    bootstrapLogger.warn("B", "two", { requestId: "r2" });
    bootstrapLogger.error("C", "three", new Error("x"), { requestId: "r3" });

    expect(spy).toHaveBeenCalledTimes(3);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });
});

describe("bootstrapLogger — Stage 10.2 request lifecycle & secret redaction", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requestStart emits a structured info entry tagged phase=request-start", () => {
    const { lines, spy } = captureLog();

    bootstrapLogger.requestStart("ObservabilityMiddleware", "Request started", {
      requestId: "req-start",
      correlationId: "corr-start",
      endpoint: "GET /health",
      metadata: { method: "GET", url: "/health", ip: "127.0.0.1" },
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.level).toBe("info");
    expect(entry.phase).toBe("request-start");
    expect(entry.component).toBe("ObservabilityMiddleware");
    expect(entry.message).toBe("Request started");
    expect(entry.requestId).toBe("req-start");
    expect(entry.correlationId).toBe("corr-start");
    expect(entry.endpoint).toBe("GET /health");
    expect(entry.metadata).toMatchObject({ method: "GET", url: "/health", ip: "127.0.0.1" });
  });

  it("requestEnd emits an info entry with statusCode and durationMs", () => {
    const { lines, spy } = captureLog();

    bootstrapLogger.requestEnd("ObservabilityMiddleware", "Request completed", {
      requestId: "req-end",
      correlationId: "corr-end",
      endpoint: "GET /health",
      statusCode: 200,
      durationMs: 12.5,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.level).toBe("info");
    expect(entry.phase).toBe("request-end");
    expect(entry.statusCode).toBe(200);
    expect(entry.durationMs).toBe(12.5);
    expect(entry.requestId).toBe("req-end");
    expect(entry.correlationId).toBe("corr-end");
  });

  it("logs the full request lifecycle start -> end with paired request ids", () => {
    const { lines, spy } = captureLog();

    bootstrapLogger.requestStart("ObservabilityMiddleware", "Request started", {
      requestId: "req-lifecycle",
      correlationId: "corr-lifecycle",
      endpoint: "POST /api/v1/tbit/vault/init",
    });
    bootstrapLogger.requestEnd("ObservabilityMiddleware", "Request completed", {
      requestId: "req-lifecycle",
      correlationId: "corr-lifecycle",
      endpoint: "POST /api/v1/tbit/vault/init",
      statusCode: 200,
      durationMs: 30,
    });

    expect(spy).toHaveBeenCalledTimes(2);
    const start = JSON.parse(lines[0]) as Record<string, unknown>;
    const end = JSON.parse(lines[1]) as Record<string, unknown>;
    expect(start.phase).toBe("request-start");
    expect(end.phase).toBe("request-end");
    // Correlated by the same request/correlation ids across start and finish.
    expect(end.requestId).toBe(start.requestId);
    expect(end.correlationId).toBe(start.correlationId);
  });

  it("redacts sensitive header values in metadata (x-tbit-api-key, authorization)", () => {
    const { lines } = captureLog();

    bootstrapLogger.info("Proxy", "Routing", {
      requestId: "r-sec1",
      metadata: {
        "x-tbit-api-key": "0d20c55fc1f2b93d057b5a6f6df10340bca3663e43e57f1de535feaa6b9ce3f0",
        authorization: "Bearer abcdef0123456789abcdef0123456789abcdef0123456789",
        method: "GET",
      },
    });

    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    const metadata = entry.metadata as Record<string, unknown>;
    // Sensitive keys are scrubbed entirely (name + value replaced by placeholder).
    expect(JSON.stringify(entry)).not.toContain("0d20c55f");
    expect(JSON.stringify(entry)).not.toContain("Bearer abcdef01");
    expect(Object.values(metadata)).toContain(REDACTED);
    // Non-sensitive sibling metadata is preserved.
    expect(metadata.method).toBe("GET");
  });

  it("redacts secret-shaped tokens inside a free-form message", () => {
    const { lines } = captureLog();
    const leakedHex = "c3f6a1d9b4e2078f5a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f";

    bootstrapLogger.warn("Vault", `Key material ${leakedHex} observed`, {
      requestId: "r-sec2",
    });

    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.message).not.toContain(leakedHex);
    expect(String(entry.message)).toContain(REDACTED);
  });

  it("redaction does not alter benign log payloads", () => {
    const { lines } = captureLog();

    bootstrapLogger.info("Memory", "Recall complete", {
      requestId: "r-plain",
      metadata: { count: 3, kernelReady: true, tags: ["a", "b"] },
    });

    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    const metadata = entry.metadata as Record<string, unknown>;
    expect(metadata.count).toBe(3);
    expect(metadata.kernelReady).toBe(true);
    expect(metadata.tags).toEqual(["a", "b"]);
  });

  it("request lifecycle entries preserve request & correlation ids", () => {
    const reqId = newRequestId();
    const corrId = newCorrelationId();
    const { lines } = captureLog();

    bootstrapLogger.requestEnd("O", "done", {
      requestId: reqId,
      correlationId: corrId,
      endpoint: "GET /readyz",
      statusCode: 503,
    });

    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.requestId).toBe(reqId);
    expect(entry.correlationId).toBe(corrId);
  });
});