import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { bootstrapLogger, newRequestId, newCorrelationId } from "./bootstrapLogger";

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