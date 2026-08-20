import { describe, it, expect, vi, afterEach, type Mock } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { observabilityMiddleware } from "./observability";
import { bootstrapLogger } from "../services/bootstrapLogger";
import { metricsCollector } from "../services/metrics";

/**
 * Stage 10.2 — observabilityMiddleware unit tests.
 * Verifies request lifecycle logging (requestStart/requestEnd via the
 * enhanced bootstrapLogger) and HTTP metrics recording on response finish.
 */

interface FinishCapableRes {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  setHeader(name: string, value: string | string[]): void;
  on(event: "finish", listener: () => void): FinishCapableRes;
  _fireFinish(): void;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: "GET",
    originalUrl: "/health",
    url: "/health",
    ip: "127.0.0.1",
    headers: { "user-agent": "vitest" },
    id: "req-obs-1",
    correlationId: "corr-obs-1",
    ...overrides,
  } as Request;
}

function makeRes(): {
  res: FinishCapableRes;
  setHeaderSpy: Mock<[name: string, value: string | string[]], void>;
} {
  const headers: Record<string, string | string[] | undefined> = {};
  const setHeaderSpy = vi.fn((name: string, value: string | string[]) => {
    headers[name] = value;
  });
  let finishListener: (() => void) | null = null;
  const res: FinishCapableRes = {
    statusCode: 200,
    headers,
    setHeader: setHeaderSpy,
    on(event, listener) {
      if (event === "finish") finishListener = listener;
      return res;
    },
    _fireFinish() {
      finishListener?.();
    },
  };
  return { res, setHeaderSpy };
}

function invoke(req: Request, res: FinishCapableRes): boolean {
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };
  observabilityMiddleware(req, res as unknown as Response, next);
  return nextCalled;
}

describe("observabilityMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    metricsCollector.reset();
  });

  it("logs a requestStart and sets the tracing headers on the request", () => {
    const startSpy = vi.spyOn(bootstrapLogger, "requestStart");
    const req = makeReq();
    const { res, setHeaderSpy } = makeRes();

    invoke(req, res);

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(startSpy).toHaveBeenCalledWith(
      "ObservabilityMiddleware",
      "Request started",
      expect.objectContaining({
        requestId: "req-obs-1",
        correlationId: "corr-obs-1",
        endpoint: "GET /health",
      })
    );
    expect(setHeaderSpy).toHaveBeenCalledWith("x-request-id", "req-obs-1");
    expect(setHeaderSpy).toHaveBeenCalledWith("x-correlation-id", "corr-obs-1");
  });

  it("logs a requestEnd with status code and duration on response finish", () => {
    const endSpy = vi.spyOn(bootstrapLogger, "requestEnd");
    const req = makeReq();
    const { res } = makeRes();
    res.statusCode = 200;

    invoke(req, res);
    res._fireFinish();

    expect(endSpy).toHaveBeenCalledTimes(1);
    const callArgs = endSpy.mock.calls[0];
    expect(callArgs[0]).toBe("ObservabilityMiddleware");
    expect(callArgs[1]).toBe("Request completed");
    expect(callArgs[2]).toMatchObject({
      requestId: "req-obs-1",
      correlationId: "corr-obs-1",
      endpoint: "GET /health",
      statusCode: 200,
    });
    expect(typeof (callArgs[2] as { durationMs: number }).durationMs).toBe("number");
  });

  it("does not log requestEnd before the response finishes", () => {
    const endSpy = vi.spyOn(bootstrapLogger, "requestEnd");
    const req = makeReq();
    const { res } = makeRes();

    invoke(req, res);

    expect(endSpy).not.toHaveBeenCalled();
  });

  it("records http request metrics on finish", () => {
    const req = makeReq();
    const { res } = makeRes();
    res.statusCode = 200;

    invoke(req, res);
    res._fireFinish();

    const metricsText = metricsCollector.getMetrics();
    // Counter for method/path/status is present.
    expect(metricsText).toContain('http_requests_total{method="GET",path="/health",status="200"}');
    expect(metricsText).toContain("http_request_duration_seconds_count");
  });

  it("passes control to the next middleware", () => {
    const req = makeReq();
    const { res } = makeRes();

    const nextCalled = invoke(req, res);

    expect(nextCalled).toBe(true);
  });
});