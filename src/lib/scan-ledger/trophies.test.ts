import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TIER_TROPHY_MODELS,
  TIER_TROPHY_POSTERS,
  legendaryCaption,
  legendaryRarityNote,
  tierTrophyPosterUrl,
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

  it("ships a still poster per tier for the GLB wait and fallback", () => {
    for (const [tier, url] of Object.entries(TIER_TROPHY_POSTERS)) {
      expect(
        tierTrophyPosterUrl(tier as keyof typeof TIER_TROPHY_POSTERS),
      ).toBe(url);
      const path = join(process.cwd(), "public", url.replace(/^\//, ""));
      expect(existsSync(path)).toBe(true);
      const bytes = statSync(path).size;
      expect(bytes).toBeGreaterThan(8_000);
      expect(bytes).toBeLessThan(80_000);
    }
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
    const trophy = readFileSync(
      join(process.cwd(), "src/app/scan/scan-trophy.tsx"),
      "utf8",
    );
    expect(trophy).toMatch(/IntersectionObserver/);
    expect(trophy).toMatch(/rootMargin/);
    expect(trophy).toMatch(/poster/);
    expect(trophy).toMatch(/useCallback\(\(\) => setReady\(true\), \[\]\)/);
    expect(trophy).not.toMatch(/onReady=\{\(\) => setReady\(true\)\}/);
    const glb = readFileSync(
      join(process.cwd(), "src/components/three/GlbTrophy.tsx"),
      "utf8",
    );
    expect(glb).toMatch(/onReadyRef/);
    expect(glb).not.toMatch(/\[url, rarity, fitBounds, onReady, onError\]/);
    const canvas = readFileSync(
      join(process.cwd(), "src/components/three/TrophyCanvas.tsx"),
      "utf8",
    );
    expect(canvas).toMatch(/isSmall \|\| fitBounds/);
    const css = readFileSync(
      join(process.cwd(), "src/app/scan/scan-ledger.css"),
      "utf8",
    );
    expect(css).toMatch(/\.trophy \{[\s\S]*overflow:\s*hidden/);
    expect(css).toMatch(/flex:\s*1 1 0/);
  });
});
