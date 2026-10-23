import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COVER_FRAME,
  COVER_WINDOW_POLYGON,
  HERO_ART,
  HERO_CROP,
  HERO_CROPS,
  HOME_HERO_COPY,
  HOME_SPEC_PLATE,
  HOME_UNLOCK_STEPS,
  HOME_UNLOCKS_COPY,
  coverWindowClipPath,
} from "@/lib/home";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const PUBLIC = join(ROOT, "public");

const HOME_FILES = [
  "src/app/page.tsx",
  "src/components/cover-frame.tsx",
  "src/components/home-hero.tsx",
  "src/components/home-library.tsx",
  "src/components/home-qr.tsx",
  "src/components/home-section.tsx",
  "src/components/home-spec-plate.tsx",
  "src/components/home-unlocks.tsx",
  "src/lib/home.ts",
];

function walk(dir: string, pattern: RegExp): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, pattern));
      continue;
    }
    if (pattern.test(name)) out.push(full);
  }
  return out;
}

function publicFile(src: string): string {
  return join(PUBLIC, src.replace(/^\//, ""));
}

describe("P1 home: canonical cover frame", () => {
  it("ships frame-front-web-full.svg as the hero frame", () => {
    expect(COVER_FRAME.fullSrc).toBe("/frames/frame-front-web-full.svg");
    const svg = readFileSync(publicFile(COVER_FRAME.fullSrc), "utf8");
    expect(svg).toContain('viewBox="0 0 1700 2200"');
    expect(svg.length).toBeLessThan(20 * 1024);

    const inks = new Set(
      [...svg.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toUpperCase()),
    );
    expect([...inks].sort()).toEqual(["#F2EAD8", "#FF4F00"]);
    expect(svg).not.toMatch(/<rect|<image|fill="#(?!F2EAD8|FF4F00)/i);
  });

  it("ships the closed variant in the same single cream ink", () => {
    const svg = readFileSync(publicFile(COVER_FRAME.closedSrc), "utf8");
    expect(svg).toContain('viewBox="0 0 1700 2200"');
    const inks = new Set(
      [...svg.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toUpperCase()),
    );
    expect([...inks]).toEqual(["#F2EAD8"]);
  });

  it("removes the rejected guidelines-v2 frame and its PNG", () => {
    expect(existsSync(join(PUBLIC, "frames/frame-portrait-cream.png"))).toBe(
      false,
    );
    const hits = walk(SRC, /\.(tsx?|css)$/)
      .filter((file) => !/\.test\.tsx?$/.test(file))
      .filter((file) =>
        /frame-portrait|portrait-frame|hero-book-3d|hero-example\.jpg/.test(
          readFileSync(file, "utf8"),
        ),
      );
    expect(hits).toEqual([]);
  });

  it("keeps the frame portrait and the window at Studio's geometry", () => {
    expect(COVER_FRAME.width / COVER_FRAME.height).toBeCloseTo(1700 / 2200);
    expect(COVER_FRAME.window).toEqual({
      x: 140,
      y: 614,
      width: 1420,
      height: 1310,
    });
    expect(COVER_WINDOW_POLYGON).toHaveLength(20);
    const clip = coverWindowClipPath();
    expect(clip.startsWith("polygon(0% 3.9695%, 1.831% 3.9695%")).toBe(true);
    expect(clip).toContain("100% 96.0305%");
  });

  it("drives the hero art from one crop value with every crop on disk", () => {
    expect(HERO_CROPS[HERO_CROP]).toBe(HERO_ART);
    expect(HERO_CROP).toBe("H1");
    for (const crop of Object.values(HERO_CROPS)) {
      const path = publicFile(crop.src);
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeLessThan(400 * 1024);
      expect(crop.alt.length).toBeGreaterThan(10);
    }
  });
});

describe("P1 home: type, color and texture guardrails", () => {
  it("uses Redaction exactly once on home, for the H1", () => {
    let displayCount = 0;
    for (const relative of HOME_FILES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      displayCount += text.match(/font-display/g)?.length ?? 0;
    }
    expect(displayCount).toBe(1);
    const hero = readFileSync(
      join(ROOT, "src/components/home-hero.tsx"),
      "utf8",
    );
    expect(hero).toMatch(/<h1[\s\S]{0,80}font-display cover-title/);
  });

  it("paints no orange fills and no fourth face on home", () => {
    const hits: string[] = [];
    for (const relative of HOME_FILES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      text.split("\n").forEach((line, index) => {
        if (
          /bg-(?:primary|signal|brand-orange|accent)\b|bg-\[#ff4f00\]|fill="#ff4f00"|border-signal|Rajdhani|Oswald/i.test(
            line,
          )
        ) {
          hits.push(`${relative}:${index + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("keeps texture off every site surface", () => {
    const sources = walk(SRC, /\.(tsx?|css)$/).filter(
      (file) => !/\.test\.tsx?$/.test(file),
    );
    const hits = sources.filter((file) =>
      /fleck|noise\.svg/i.test(readFileSync(file, "utf8")),
    );
    expect(hits).toEqual([]);
    expect(walk(PUBLIC, /fleck|texture|noise/i)).toEqual([]);

    for (const relative of HOME_FILES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      expect(text).not.toMatch(/background-image|bg-\[url/);
    }
  });
});

describe("P1 home: copy and values", () => {
  it("keeps the unlocks steps word for word from the guide", () => {
    expect(HOME_UNLOCK_STEPS.map((step) => step.label)).toEqual([
      "Scan the code",
      "Scan your colored pages to earn points",
      "Spend points on more unlocks",
    ]);
    expect(HOME_UNLOCK_STEPS.map((step) => step.number)).toEqual([
      "01",
      "02",
      "03",
    ]);
  });

  it("speaks to you, without hype", () => {
    const joined = [
      HOME_HERO_COPY.tagline,
      HOME_HERO_COPY.body,
      HOME_UNLOCKS_COPY.heading,
      HOME_UNLOCKS_COPY.qrCaption,
      ...HOME_UNLOCK_STEPS.map((step) => step.label),
    ].join(" ");
    expect(joined).not.toMatch(/!/);
    expect(joined.toLowerCase()).not.toMatch(/\bwe\b|\bour\b|free|prize/);
  });

  it("ships no SAMPLE values or captions", () => {
    const text = HOME_FILES.map((relative) =>
      readFileSync(join(ROOT, relative), "utf8"),
    ).join("\n");
    expect(text).not.toMatch(/sample/i);
    expect(text).not.toMatch(/MB-GNS|CAT NO|qr-MB/i);
    expect(HOME_SPEC_PLATE.rows.map((row) => row.label)).not.toContain(
      "Cat no",
    );
  });

  it("points the QR at the site's own scan route", () => {
    expect(HOME_UNLOCKS_COPY.qrPath).toBe("/scan");
    expect(existsSync(join(SRC, "app/scan/page.tsx"))).toBe(true);
  });
});
