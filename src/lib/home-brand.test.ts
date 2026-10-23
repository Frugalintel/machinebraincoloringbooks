import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FRAME_PORTRAIT_HEIGHT,
  FRAME_PORTRAIT_SRC,
  FRAME_PORTRAIT_WIDTH,
  HOME_CLOSE_COPY,
  HOME_HERO_COPY,
  HOME_UNLOCK_STEPS,
} from "@/lib/home";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const HOME_FILES = [
  "src/app/page.tsx",
  "src/components/hero.tsx",
  "src/components/hero-card.tsx",
  "src/components/home-how-it-works.tsx",
  "src/components/home-featured.tsx",
  "src/components/home-close.tsx",
  "src/components/portrait-frame.tsx",
  "src/components/cover-art.tsx",
  "src/lib/hero-card.ts",
  "src/lib/home.ts",
];

const BANNED = [
  "hero-book-3d",
  "hero-book-front",
  "hero-book-spine",
  "hero-example.jpg",
  "--hero-accent",
  "Free shipping",
  "Unlock Rewards",
  "Unlock rewards",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (/\.(tsx|ts|css)$/.test(name)) out.push(full);
  }
  return out;
}

describe("P1 home brand guardrail", () => {
  it("ships a portrait cream frame well under 150 KB", () => {
    const path = join(ROOT, "public", FRAME_PORTRAIT_SRC.replace(/^\//, ""));
    expect(existsSync(path)).toBe(true);
    const buf = readFileSync(path);
    expect(buf.length).toBeLessThan(150 * 1024);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(FRAME_PORTRAIT_WIDTH);
    expect(height).toBe(FRAME_PORTRAIT_HEIGHT);
    expect(width / height).toBeLessThan(1);
  });

  it("removes the fake hardcover JPEG and 3D hero styles", () => {
    expect(existsSync(join(ROOT, "public/covers/hero-example.jpg"))).toBe(
      false,
    );
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8");
    expect(css).not.toMatch(/hero-book|hero-cover-stage|--page-1/);
  });

  it("keeps home copy in the locked voice", () => {
    const joined = [
      HOME_HERO_COPY.subcopy,
      HOME_CLOSE_COPY.body,
      ...HOME_UNLOCK_STEPS.map((step) => `${step.label} ${step.copy}`),
    ].join(" ");

    expect(joined).not.toMatch(/!/);
    expect(joined.toLowerCase()).not.toMatch(/\bwe\b|\bour\b/);
    expect(HOME_UNLOCK_STEPS.map((step) => step.label)).toEqual([
      "Scan the code",
      "Scan your colored pages to earn points",
      "Spend points on more unlocks",
    ]);
  });

  it("uses one Redaction H1 and no orange fills on home", () => {
    const hits: string[] = [];
    let displayCount = 0;

    for (const relative of HOME_FILES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      text.split("\n").forEach((line, index) => {
        if (line.includes("font-display")) displayCount += 1;
        if (
          /bg-(?:primary|signal|brand-orange)|bg-\[#(?:ff4f00|FF4F00)\]|bg-\(--hero-accent\)/i.test(
            line,
          )
        ) {
          hits.push(`${relative}:${index + 1}:${line.trim()}`);
        }
        for (const token of BANNED) {
          if (line.includes(token)) {
            hits.push(`${relative}:${index + 1}:${token}`);
          }
        }
      });
    }

    expect(hits).toEqual([]);
    expect(displayCount).toBe(1);
  });

  it("does not reintroduce 3D hero utilities anywhere in src", () => {
    const files = walk(SRC);
    const hits: string[] = [];
    for (const file of files) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      if (file.endsWith("ui-brand.ts")) continue;
      const text = readFileSync(file, "utf8");
      if (/hero-book-3d|hero-example\.jpg|--hero-accent/.test(text)) {
        hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });
});
