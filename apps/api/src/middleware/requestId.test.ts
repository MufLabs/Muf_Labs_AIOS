import { describe, it, expect, vi, afterEach, type Mock } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  requestIdMiddleware,
  REQUEST_ID_HEADER,
  CORRELATION_ID_HEADER,
} from "./requestId";

/**
 * Stage 10.1 — requestIdMiddleware unit tests.
 * Verifies request/correlation ID generation, header propagation, and
 * start-time capture consumed by the Stage 10.2 observability middleware.
 */

interface MockRes {
  headers: Record<string, string | string[] | undefined>;
  setHeader(name: string, value: string | string[]): void;
}

function makeReq(headers: Record<string, string | string[] | undefined> = {}): Request {
  return { headers } as Request;
}

function makeRes(): {
  res: MockRes;
  setHeaderSpy: Mock<[name: string, value: string | string[]], void>;
} {
  const headers: Record<string, string | string[] | undefined> = {};
  const setHeaderSpy = vi.fn((name: string, value: string | string[]) => {
    headers[name] = value;
  });
  return {
    res: { headers, setHeader: setHeaderSpy } as unknown as MockRes,
    setHeaderSpy,
  };
}

function invoke(req: Request, res: MockRes): { nextCalled: boolean } {
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };
  requestIdMiddleware(req, res as unknown as Response, next);
  return { nextCalled };
}

describe("requestIdMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a request id and correlation id when none are supplied", () => {
    const req = makeReq();
    const { res } = makeRes();

    const { nextCalled } = invoke(req, res);

    expect(nextCalled).toBe(true);
    expect(typeof (req as Request & { id: string }).id).toBe("string");
    expect((req as Request & { id: string }).id).toMatch(/^[0-9a-f-]{36}$/i);
    expect((req as Request & { correlationId: string }).correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, expect.any(String));
  });

  it("propagates an incoming X-Request-Id when present", () => {
    const incoming = "incoming-request-1";
    const req = makeReq({ [REQUEST_ID_HEADER]: incoming });
    const { res, setHeaderSpy } = makeRes();

    invoke(req, res);

    expect((req as Request & { id: string }).id).toBe(incoming);
    expect(setHeaderSpy).toHaveBeenCalledWith(REQUEST_ID_HEADER, incoming);
  });

  it("generates a fresh correlation id distinct from an incoming request id", () => {
    const req = makeReq({ [REQUEST_ID_HEADER]: "ext-request" });
    const { res } = makeRes();

    invoke(req, res);

    const corr = (req as Request & { correlationId: string }).correlationId;
    expect(corr).toMatch(/^[0-9a-f-]{36}$/i);
    expect(corr).not.toBe("ext-request");
  });

  it("records a start timestamp on the request for duration measurement", () => {
    const req = makeReq() as Request & { _startTime?: number };
    const { res } = makeRes();
    const before = Date.now();

    invoke(req, res);

    expect(typeof req._startTime).toBe("number");
    expect(req._startTime!).toBeGreaterThanOrEqual(before);
    expect(req._startTime!).toBeLessThanOrEqual(Date.now());
  });

  it("sets both response headers for client-side tracing", () => {
    const req = makeReq();
    const { res, setHeaderSpy } = makeRes();

    invoke(req, res);

    expect(setHeaderSpy).toHaveBeenCalledWith(REQUEST_ID_HEADER, expect.any(String));
    expect(setHeaderSpy).toHaveBeenCalledWith(CORRELATION_ID_HEADER, expect.any(String));
  });
});