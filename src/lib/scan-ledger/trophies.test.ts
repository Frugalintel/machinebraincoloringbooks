import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TIER_TROPHY_MODELS,
  legendaryCaption,
  legendaryRarityNote,
  tierTrophyUrl,
} from "@/lib/scan-ledger/trophies";
import { TIER_NAME_RARE } from "@/lib/scan-tiers";

describe("example trophy models", () => {
  it("maps each tier to a versioned meshopt GLB in public/models", () => {
    expect(TIER_TROPHY_MODELS[TIER_NAME_RARE]).toBe(
      "/models/ferris-wheel-rare.v1.glb",
    );
    expect(tierTrophyUrl("Pro")).toBe("/models/ferris-wheel-pro.v1.glb");
    expect(tierTrophyUrl("No tier yet")).toBeNull();
    for (const url of Object.values(TIER_TROPHY_MODELS)) {
      const path = join(process.cwd(), "public", url.replace(/^\//, ""));
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(1_000_000);
    }
  });

  it("keeps the Legendary caption as viewport copy", () => {
    expect(legendaryCaption(null, 80)).toBe("LEGENDARY · NOT FOUND");
    expect(legendaryCaption(23, 80)).toBe("LEGENDARY · FOUND AT 23 PTS");
    expect(legendaryRarityNote(80)).toBe("LOWER IS RARER · 2 TO 80");
  });

  it("loads TrophyCanvas only when a GLB is shown", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/scan/scan-trophy.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/from ["']@\/components\/three["']/);
    expect(source).toMatch(/import\(["']@\/components\/three["']\)/);
    expect(
      readFileSync(join(process.cwd(), "src/app/scan/page.tsx"), "utf8"),
    ).not.toMatch(/GlbTrophy|TrophyCanvas|GLTFLoader/);
  });
});
