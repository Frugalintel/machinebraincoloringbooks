import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FITTED_LOOK_AT,
  FRAME_PADDING,
  fittedCameraDistance,
  fittedCameraPosition,
  PRO_EMISSIVE_INTENSITY,
} from "@/lib/scan-ledger/trophy-frame";

describe("fitted trophy camera", () => {
  it("aims at the origin and sizes distance from FOV and 12% padding", () => {
    expect(FITTED_LOOK_AT).toEqual([0, 0, 0]);
    expect(FRAME_PADDING).toBe(0.12);
    const fov = 32;
    const distance = fittedCameraDistance(fov);
    const fittedSize = 1 - FRAME_PADDING;
    const visible = fittedSize / (1 - FRAME_PADDING);
    const expected = visible / 2 / Math.tan((fov * Math.PI) / 360);
    expect(distance).toBeCloseTo(expected);
    expect(distance).toBeLessThan(2.85);
    expect(fittedCameraPosition(fov)).toEqual([0, 0, distance]);
  });

  it("keeps Pro emissive low enough that silver shading survives", () => {
    expect(PRO_EMISSIVE_INTENSITY).toBeLessThanOrEqual(0.05);
    const look = readFileSync(
      join(process.cwd(), "src/components/three/GlbTrophy.tsx"),
      "utf8",
    );
    expect(look).toMatch(/PRO_EMISSIVE_INTENSITY|emissiveIntensity = 0\.05/);
    expect(look).not.toMatch(/emissiveIntensity,\s*0\.22/);
  });
});
