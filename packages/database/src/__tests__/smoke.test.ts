import { describe, it, expect } from "vitest";
import * as database from "../index";

describe("@aios/database smoke test", () => {
  it("should export expected modules", () => {
    expect(database).toBeDefined();
    // Verify key exports exist
    const exports = Object.keys(database);
    expect(exports.length).toBeGreaterThan(0);
  });

  it("should export TBitContainer class", () => {
    expect(database.TBitContainer).toBeDefined();
  });

  it("should export MemoryCore functions", () => {
    expect(database.rememberMemory).toBeDefined();
    expect(database.recallMemory).toBeDefined();
  });

  it("should export QueryIndex functions", () => {
    expect(database.getQueryIndexStats).toBeDefined();
    expect(database.searchQueryIndex).toBeDefined();
  });
});