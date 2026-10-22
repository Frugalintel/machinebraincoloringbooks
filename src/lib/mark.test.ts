import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FULL_MARK_MIN_PX,
  HEADER_MARK_SIZE_DESKTOP_PX,
  HEADER_MARK_SIZE_MOBILE_PX,
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

  it("uses the S3 cream SVG just below the 48 px boundary", () => {
    expect(resolveMarkAsset(47, "cream")).toEqual({
      cut: "small",
      ink: "cream",
      src: "/brand/mb-mark-S3-small-cream.svg",
    });
  });

  it("uses the S3 ink SVG below 48 px on light surfaces", () => {
    expect(resolveMarkAsset(32, "ink")).toEqual({
      cut: "small",
      ink: "ink",
      src: "/brand/mb-mark-S3-small-ink.svg",
    });
  });

  it("uses the S3 cream SVG at the official 16/24/32 sizes", () => {
    for (const size of [16, 24, 32]) {
      expect(resolveMarkAsset(size, "cream")).toEqual({
        cut: "small",
        ink: "cream",
        src: "/brand/mb-mark-S3-small-cream.svg",
      });
    }
  });

  it("maps the header mobile/desktop sizes across the 48 px boundary", () => {
    expect(HEADER_MARK_SIZE_MOBILE_PX).toBe(32);
    expect(HEADER_MARK_SIZE_DESKTOP_PX).toBe(48);
    expect(resolveMarkAsset(HEADER_MARK_SIZE_MOBILE_PX)?.cut).toBe("small");
    expect(resolveMarkAsset(HEADER_MARK_SIZE_DESKTOP_PX)?.cut).toBe("full");
  });

  it("rejects non-positive and non-finite sizes", () => {
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
  it("includes official full mark-v6 and S3 small-cut files only (no S4)", () => {
    const brandDir = join(process.cwd(), "public/brand");
    expect(existsSync(brandDir)).toBe(true);
    const files = readdirSync(brandDir).sort();
    expect(files).toEqual(
      [
        "mb-mark-S3-small-16px-cream.png",
        "mb-mark-S3-small-16px-cream@2x.png",
        "mb-mark-S3-small-16px-ink.png",
        "mb-mark-S3-small-16px-ink@2x.png",
        "mb-mark-S3-small-24px-cream.png",
        "mb-mark-S3-small-24px-cream@2x.png",
        "mb-mark-S3-small-24px-ink.png",
        "mb-mark-S3-small-24px-ink@2x.png",
        "mb-mark-S3-small-32px-cream.png",
        "mb-mark-S3-small-32px-cream@2x.png",
        "mb-mark-S3-small-32px-ink.png",
        "mb-mark-S3-small-32px-ink@2x.png",
        "mb-mark-S3-small-cream.svg",
        "mb-mark-S3-small-ink.svg",
        "mb-mark-full-128px-cream.png",
        "mb-mark-full-128px-ink.png",
        "mb-mark-full-256px-cream.png",
        "mb-mark-full-256px-ink.png",
        "mb-mark-full-48px-cream.png",
        "mb-mark-full-48px-ink.png",
        "mb-mark-full-64px-cream.png",
        "mb-mark-full-64px-ink.png",
        "mb-mark-full-cream.svg",
        "mb-mark-full-ink.svg",
      ].sort(),
    );
    expect(files.some((name) => /s4|pixel-fit/i.test(name))).toBe(false);
  });
});
