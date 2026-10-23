import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { QR_QUIET_ZONE_MODULES, buildQrSvgPath } from "@/lib/qr";
import { DEFAULT_SITE_URL, SITE_URL, siteUrl } from "@/lib/site-url";

function darkModules(path: string, quiet: number): Set<string> {
  const cells = new Set<string>();
  for (const match of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const [x, y, run] = match.slice(1).map(Number);
    for (let i = 0; i < run; i += 1) cells.add(`${y - quiet},${x - quiet + i}`);
  }
  return cells;
}

describe("site URL", () => {
  it("falls back to the production domain", () => {
    expect(DEFAULT_SITE_URL).toBe("https://machinebraincoloringbooks.com");
    expect(SITE_URL).not.toMatch(/\/$/);
    expect(siteUrl("/scan")).toBe(`${SITE_URL}/scan`);
  });

  it("only builds URLs for root-relative paths", () => {
    expect(() => siteUrl("scan")).toThrow();
    expect(() => siteUrl("https://example.com/scan")).toThrow();
  });
});

describe("buildQrSvgPath", () => {
  it("draws every dark module of the encoded matrix inside a 4-module quiet zone", () => {
    const value = siteUrl("/scan");
    const qr = buildQrSvgPath(value);
    const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });

    expect(QR_QUIET_ZONE_MODULES).toBeGreaterThanOrEqual(4);
    expect(qr.size).toBe(modules.size);
    expect(qr.viewBoxSize).toBe(modules.size + QR_QUIET_ZONE_MODULES * 2);

    const drawn = darkModules(qr.path, QR_QUIET_ZONE_MODULES);
    let expected = 0;
    for (let row = 0; row < modules.size; row += 1) {
      for (let col = 0; col < modules.size; col += 1) {
        if (modules.get(row, col)) {
          expected += 1;
          expect(drawn.has(`${row},${col}`)).toBe(true);
        }
      }
    }
    expect(drawn.size).toBe(expected);
  });
});
