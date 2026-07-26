import { describe, it, expect } from "vitest";
import * as kernel from "../index";

describe("@aios/kernel smoke test", () => {
  it("should export expected modules", () => {
    expect(kernel).toBeDefined();
    const exports = Object.keys(kernel);
    expect(exports.length).toBeGreaterThan(0);
  });
});
