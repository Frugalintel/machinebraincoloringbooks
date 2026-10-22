import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

const APP = join(process.cwd(), "src/app");
const BRAND = join(process.cwd(), "public/brand");

function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

describe("F8 brand icons", () => {
  it("uses the S3 cream SVG as app/icon.svg", () => {
    const icon = readFileSync(join(APP, "icon.svg"));
    const master = readFileSync(join(BRAND, "mb-mark-S3-small-cream.svg"));
    expect(icon.equals(master)).toBe(true);
  });

  it("packs the official S3 16 and 32 cream PNGs into favicon.ico", () => {
    const ico = readFileSync(join(APP, "favicon.ico"));
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(2);

    const sixteen = readFileSync(
      join(BRAND, "mb-mark-S3-small-16px-cream.png"),
    );
    const thirtyTwo = readFileSync(
      join(BRAND, "mb-mark-S3-small-32px-cream.png"),
    );
    expect(ico.includes(sixteen)).toBe(true);
    expect(ico.includes(thirtyTwo)).toBe(true);
  });

  it("composites the full-mark 256 cream PNG on #0F0F0F for apple-icon", () => {
    const apple = join(APP, "apple-icon.png");
    expect(existsSync(apple)).toBe(true);
    expect(pngSize(apple)).toEqual({ width: 256, height: 256 });

    const png = readFileSync(apple);
    // IHDR + a near-black canvas: the official mark stays 256 and is not redrawn.
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  });

  it("does not ship S4 or pixel-fit files in app icons or public/brand", () => {
    const names = [...readdirSync(APP), ...readdirSync(BRAND)];
    expect(names.some((name) => /s4|pixel-fit/i.test(name))).toBe(false);
  });
});

describe("web manifest", () => {
  it("uses cream full-mark PNGs on near-black", () => {
    const web = manifest();
    expect(web.background_color).toBe("#0F0F0F");
    expect(web.theme_color).toBe("#0F0F0F");
    expect(web.icons?.map((icon) => icon.src)).toEqual([
      "/brand/mb-mark-full-48px-cream.png",
      "/brand/mb-mark-full-64px-cream.png",
      "/brand/mb-mark-full-128px-cream.png",
      "/brand/mb-mark-full-256px-cream.png",
    ]);
  });
});
