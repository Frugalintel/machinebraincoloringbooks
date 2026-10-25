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
    expect(FERRIS_WHEEL_MODEL_URL).toBe("/models/ferris-wheel-tripo.glb");

    for (const item of items) {
      if (item.id === "omega-station") continue;
      expect(collectibleModelUrl(item.id)).toBeUndefined();
    }
  });

  it("ships the web meshopt GLB in public/models and not the fallback", () => {
    const webPath = join(ROOT, "public/models/ferris-wheel-tripo.glb");
    expect(existsSync(webPath)).toBe(true);
    expect(statSync(webPath).size).toBe(2_593_176);
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
});
