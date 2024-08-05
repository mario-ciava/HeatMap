import { describe, it, expect, beforeEach } from "vitest";
import { TileRegistry } from "../src/registry/TileRegistry.js";

const sampleAssets = [
  { ticker: "AAA", price: 10, basePrice: 10 },
  { ticker: "BBB", price: 20, basePrice: 20 },
];

describe("TileRegistry", () => {
  let registry;

  beforeEach(() => {
    registry = new TileRegistry(sampleAssets);
  });

  it("maps tickers to indexes", () => {
    expect(registry.getAssetIndex("AAA")).toBe(0);
    expect(registry.getAssetIndex("BBB")).toBe(1);
    expect(registry.getAssetIndex("ZZZ")).toBe(-1);
  });

  it("appends price and clamps history length", () => {
    const length1 = registry.appendPrice("AAA", 11, 3);
    registry.appendPrice("AAA", 12, 3);
    registry.appendPrice("AAA", 13, 3);
    const length2 = registry.appendPrice("AAA", 14, 3);

    expect(length1).toBe(1);
    expect(length2).toBe(3);
    expect(registry.getHistory("AAA")).toEqual([12, 13, 14]);
  });

  it("resets price histories per mode", () => {
    registry.resetPriceHistoryForMode("simulation");
    expect(registry.getHistory("AAA")).toEqual([10]);

    registry.resetPriceHistoryForMode("real");
    expect(registry.getHistory("AAA")).toEqual([]);
  });
});
