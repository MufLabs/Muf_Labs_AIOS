import { describe, it, expect } from "vitest";
import * as llm from "../index";

describe("@aios/llm smoke test", () => {
  it("should export expected modules", () => {
    expect(llm).toBeDefined();
    const exports = Object.keys(llm);
    expect(exports.length).toBeGreaterThan(0);
  });
});
