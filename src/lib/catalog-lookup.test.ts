import { describe, expect, it } from "vitest";
import { findCollectibleById } from "@/lib/game-data";
import { getProductById } from "@/lib/store-data";

describe("findCollectibleById", () => {
  it("returns the catalog item and its set", () => {
    const found = findCollectibleById("rover-x");
    expect(found?.item.id).toBe("rover-x");
    expect(found?.item.name).toBe("Rover-X");
    expect(found?.set.id).toBe("set-01");
  });

  it("returns null for a missing collectible", () => {
    expect(findCollectibleById("missing-artifact-f7")).toBeNull();
    expect(findCollectibleById("")).toBeNull();
    expect(findCollectibleById(undefined)).toBeNull();
  });
});

describe("static catalog product ids", () => {
  it("does not treat a missing store id as a catalog hit", () => {
    expect(getProductById("1")?.id).toBe("1");
    expect(getProductById("missing-product-f7")).toBeUndefined();
  });
});
