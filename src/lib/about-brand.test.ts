import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ABOUT_ART,
  ABOUT_BEYOND_COPY,
  ABOUT_HERO_COPY,
  ABOUT_PRINCIPLES,
  ABOUT_REST_COPY,
  ABOUT_STUDIO_COPY,
  ABOUT_WORLDS_COPY,
} from "@/lib/about";
import { SAMPLE_BOOKS } from "@/lib/home";

const ROOT = process.cwd();
const ABOUT_FILES = [
  "src/app/about/page.tsx",
  "src/app/about/layout.tsx",
  "src/app/about/about.css",
  "src/lib/about.ts",
];

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf8");
}

describe("About copy and assets", () => {
  it("speaks to you, without hype or invented history", () => {
    const joined = [
      ABOUT_HERO_COPY.lede,
      ABOUT_REST_COPY.body,
      ...ABOUT_PRINCIPLES.map((item) => `${item.title} ${item.body}`),
      ABOUT_WORLDS_COPY.lead,
      ABOUT_BEYOND_COPY.body,
      ABOUT_STUDIO_COPY.body,
    ].join(" ");
    expect(joined).not.toMatch(/!/);
    expect(joined.toLowerCase()).not.toMatch(/\bwe\b|\bour\b|prize|guarantee/);
    expect(ABOUT_STUDIO_COPY.label).toMatch(/placeholder/i);
  });

  it("keeps sample books as the repo sample set", () => {
    expect(SAMPLE_BOOKS.map((book) => book.title)).toEqual([
      "The Wandering Keep",
      "The Silver Citadel",
      "The Far Station",
      "Into the Deep Forest",
      "A Quiet Night In",
    ]);
    expect(ABOUT_WORLDS_COPY.sampleNote).toMatch(/sample/i);
  });

  it("ships the about-only rasters and reuses Home's color plate", () => {
    expect(existsSync(join(ROOT, "public", ABOUT_ART.line.src))).toBe(true);
    expect(existsSync(join(ROOT, "public", ABOUT_ART.glasshouse.src))).toBe(
      true,
    );
    expect(ABOUT_ART.color.src).toBe("/home/plate-color.webp");
    expect(existsSync(join(ROOT, "public", ABOUT_ART.color.src))).toBe(true);
  });

  it("uses Redaction exactly once, for the hero H1", () => {
    let count = 0;
    for (const relative of ABOUT_FILES) {
      count += read(relative).match(/font-display|redaction/gi)?.length ?? 0;
    }
    expect(count).toBe(1);
    expect(read("src/app/about/page.tsx")).toMatch(
      /<h1 id="about-h1" className="spread-h1 font-display">/,
    );
  });

  it("keeps orange to small labels on near-black", () => {
    const css = read("src/app/about/about.css");
    const orange = [
      ...css.matchAll(/([^{}]*)\{([^{}]*--signal|#ff4f00|255 79 0)[^}]*\}/gi),
    ].map((match) => match[1].trim());
    expect(orange).toEqual([
      ".about-a .spread-sig",
      ".about-a .spread-ph .mono",
    ]);
  });
});
