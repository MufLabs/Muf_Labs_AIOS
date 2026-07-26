import { describe, it, expect } from "vitest";
import * as agents from "../index";

describe("@aios/agents smoke test", () => {
  it("should export expected modules", () => {
    expect(agents).toBeDefined();
    const exports = Object.keys(agents);
    expect(exports.length).toBeGreaterThan(0);
  });
});
