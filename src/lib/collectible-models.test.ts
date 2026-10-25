import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectionSets } from "@/lib/game-data";
import {
  FERRIS_WHEEL_MODEL_URL,
  collectibleModelUrl,
} from "@/lib/collectible-models";

const ROOT = process.cwd();

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf8");
}

describe("collectible model mapping", () => {
  it("gives only omega-station a real GLB and leaves the other eight on the placeholder", () => {
    const items = collectionSets.flatMap((set) => set.items);
    expect(items).toHaveLength(9);
    expect(collectibleModelUrl("omega-station")).toBe(FERRIS_WHEEL_MODEL_URL);
    expect(FERRIS_WHEEL_MODEL_URL).toBe("/models/ferris-wheel-tripo.v1.glb");

    for (const item of items) {
      if (item.id === "omega-station") continue;
      expect(collectibleModelUrl(item.id)).toBeUndefined();
    }
  });

  it("ships the web meshopt GLB in public/models and not the fallback", () => {
    const webPath = join(ROOT, "public/models/ferris-wheel-tripo.v1.glb");
    expect(existsSync(webPath)).toBe(true);
    expect(statSync(webPath).size).toBe(2_593_176);
    expect(existsSync(join(ROOT, "public/models/ferris-wheel-tripo.glb"))).toBe(
      false,
    );
    expect(
      existsSync(join(ROOT, "public/models/ferris-wheel-tripo-fallback.glb")),
    ).toBe(false);
  });
});

describe("lazy GLB loaders", () => {
  const loaderRe = /GLTFLoader|MeshoptDecoder|meshopt_decoder|RoomEnvironment/;

  it("does not import GLTF loaders from the home index path", () => {
    expect(read("src/app/page.tsx")).not.toMatch(loaderRe);
    expect(read("src/app/page.tsx")).not.toMatch(
      /GlbTrophy|ferris-wheel|collectible-models|TrophyCanvas/,
    );
  });

  it("keeps GLTF loaders out of TrophyCanvas, the three barrel, and ObjectSlot top-level imports", () => {
    const canvas = read("src/components/three/TrophyCanvas.tsx");
    const barrel = read("src/components/three/index.ts");
    const slot = read("src/components/collectibles/object-slot.tsx");

    expect(canvas).not.toMatch(loaderRe);
    expect(canvas).not.toMatch(/from ["']\.\/GlbTrophy["']/);
    expect(canvas).toMatch(/import\(["']\.\/GlbTrophy["']\)/);
    expect(canvas).toMatch(/showPlaceholder = !modelUrl \|\| glbFailed/);
    expect(canvas).toMatch(/dpr=\{pixelRatio\}/);
    expect(canvas).toMatch(/isSmall \|\| compact \? \[1, 1\.5\] : \[1, 2\]/);
    expect(canvas).toMatch(/shadows=\{Boolean\(modelUrl\) && !isSmall\}/);
    expect(canvas).toMatch(/toneMappingExposure = 1\.2/);
    expect(barrel).not.toMatch(loaderRe);
    expect(barrel).not.toMatch(/GlbTrophy/);
    expect(slot).not.toMatch(loaderRe);
    expect(slot).toMatch(/collectibleModelUrl/);
    expect(slot).toMatch(/modelUrl/);
  });

  it("does not wire the sample model into Trophy Room", () => {
    const source = read("src/app/trophy-room/page.tsx");
    expect(source).not.toMatch(/modelUrl|collectibleModelUrl|GlbTrophy/);
  });

  it("lets GLTF blob textures through the production CSP", () => {
    expect(read("next.config.ts")).toMatch(/connect-src[^"]*blob:/);
  });

  it("serves versioned models as immutable cacheable assets", () => {
    const config = read("next.config.ts");
    expect(config).toMatch(/source: "\/models\/:path\*"/);
    expect(config).toMatch(
      /Cache-Control[\s\S]*public, max-age=31536000, immutable/,
    );
  });

  it("frames, fades, and rotates the sample on a clock delta", () => {
    const source = read("src/components/three/GlbTrophy.tsx");
    expect(source).toMatch(/scale: 1\.75, y: -0\.66/);
    expect(source).toMatch(/scale: 1\.5, y: -0\.3/);
    expect(source).toMatch(/scale: 1\.38, y: -0\.22/);
    expect(source).toMatch(/rotation\.y \+= delta \* ROTATION_SPEED/);
    expect(source).toMatch(/FADE_SECONDS = 0\.25/);
    expect(source).toMatch(/shadowMaterial opacity=\{0\.35\}/);
    expect(source).not.toMatch(/rotation\.y \+= 0\.005/);
  });
});
