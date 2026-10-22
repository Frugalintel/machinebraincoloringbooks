import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FULL_MARK_MIN_PX,
  MARK_CORNER_ARM_RATIO,
  markClearSpacePx,
  resolveMarkAsset,
} from "@/lib/mark";

describe("resolveMarkAsset", () => {
  it("uses the full cream mark-v6 SVG at the 48 px minimum", () => {
    expect(resolveMarkAsset(FULL_MARK_MIN_PX, "cream")).toEqual({
      cut: "full",
      ink: "cream",
      src: "/brand/mb-mark-full-cream.svg",
    });
  });

  it("uses the full ink mark-v6 SVG on light surfaces at 48 px and above", () => {
    expect(resolveMarkAsset(64, "ink")).toEqual({
      cut: "full",
      ink: "ink",
      src: "/brand/mb-mark-full-ink.svg",
    });
  });

  it("defaults to cream when ink is omitted", () => {
    expect(resolveMarkAsset(80)?.ink).toBe("cream");
  });

  it("returns null below 48 px so callers keep the wordmark-only fallback", () => {
    expect(resolveMarkAsset(47, "cream")).toBeNull();
    expect(resolveMarkAsset(32, "ink")).toBeNull();
    expect(resolveMarkAsset(24)).toBeNull();
    expect(resolveMarkAsset(16)).toBeNull();
    expect(resolveMarkAsset(0)).toBeNull();
    expect(resolveMarkAsset(-1)).toBeNull();
    expect(resolveMarkAsset(Number.NaN)).toBeNull();
  });
});

describe("markClearSpacePx", () => {
  it("is one corner arm of the mark-v6 viewBox (150 / 1000)", () => {
    expect(MARK_CORNER_ARM_RATIO).toBe(0.15);
    expect(markClearSpacePx(1000)).toBe(150);
    expect(markClearSpacePx(80)).toBe(12);
    expect(markClearSpacePx(48)).toBeCloseTo(7.2);
  });
});

describe("shipped brand assets", () => {
  it("includes only full mark-v6 files (no small-cut / S4)", () => {
    const brandDir = join(process.cwd(), "public/brand");
    expect(existsSync(brandDir)).toBe(true);
    const files = readdirSync(brandDir);
    expect(files.sort()).toEqual([
      "mb-mark-full-cream.svg",
      "mb-mark-full-ink.svg",
    ]);
    expect(files.some((name) => /s4|small/i.test(name))).toBe(false);
  });
});
