import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  HOME_ART,
  HOME_ENTER_COPY,
  HOME_FOOTER_COPY,
  HOME_HERO_COPY,
  HOME_POINTS,
  HOME_ROUTES,
  HOME_WORLDS,
  SAMPLE_BOOKS,
  homeShowsSamples,
} from "@/lib/home";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const PUBLIC = join(ROOT, "public");
const CSS = readFileSync(join(SRC, "app/home.css"), "utf8");

const HOME_FILES = [
  "src/app/page.tsx",
  "src/app/home.css",
  "src/components/home-footer.tsx",
  "src/components/home-hero.tsx",
  "src/components/home-plate.tsx",
  "src/components/home-plates.tsx",
  "src/components/home-shop.tsx",
  "src/components/home-worlds.tsx",
  "src/lib/home.ts",
];

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf8");
}

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

/** Top-level `selector { body }` rules in home.css (media blocks flattened). */
function cssRules(): { selector: string; body: string }[] {
  const flat = CSS.replace(/\/\*[\s\S]*?\*\//g, "").replace(
    /@media[^{]+\{([\s\S]*?\})\s*\}/g,
    "$1",
  );
  return [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].trim(),
    body: match[2],
  }));
}

describe("Home SAMPLE switch", () => {
  it("shows samples everywhere except Vercel production", () => {
    expect(homeShowsSamples("production")).toBe(false);
    expect(homeShowsSamples("preview")).toBe(true);
    expect(homeShowsSamples("development")).toBe(true);
    expect(homeShowsSamples(undefined)).toBe(true);
  });

  it("keeps sample art in its own folder, apart from the real art", () => {
    for (const book of SAMPLE_BOOKS.filter((b) => b.world !== "Fantasy")) {
      expect(book.cover.startsWith("/home/sample/")).toBe(true);
    }
    for (const world of HOME_WORLDS) {
      expect(world.art.startsWith("/home/sample/")).toBe(true);
    }
    for (const art of Object.values(HOME_ART)) {
      if (typeof art === "string") continue;
      expect(art.src.startsWith("/home/sample/")).toBe(false);
      expect(existsSync(join(PUBLIC, art.src))).toBe(true);
    }
    for (const src of [
      ...SAMPLE_BOOKS.map((b) => b.cover),
      ...HOME_WORLDS.map((w) => w.art),
    ]) {
      expect(existsSync(join(PUBLIC, src))).toBe(true);
    }
  });
});

describe("Home routes", () => {
  it("maps Studio's guessed routes onto routes that exist", () => {
    for (const href of Object.values(HOME_ROUTES)) {
      const path = href.split("?")[0];
      expect(existsSync(join(SRC, "app", path, "page.tsx")), path).toBe(true);
    }
    const footer = HOME_FOOTER_COPY.groups.flatMap((group) =>
      group.links.map((link) => link.href),
    );
    expect(footer).not.toContain("#");
    expect(footer.every((href) => href.startsWith("/"))).toBe(true);
  });

  it("does not ship placeholder social links", () => {
    const text = HOME_FILES.map(read).join("\n");
    expect(text).not.toMatch(/@sample|href="#"|action="#"/);
  });
});

describe("Home type, color and texture guardrails", () => {
  it("uses Redaction exactly once on home, for the hero H1", () => {
    let count = 0;
    for (const relative of HOME_FILES) {
      count += read(relative).match(/font-display|redaction/gi)?.length ?? 0;
    }
    expect(count).toBe(1);
    expect(read("src/components/home-hero.tsx")).toMatch(
      /<h1 className="h1 font-display">/,
    );
  });

  it("sets every other face in Inter or Plex Mono, never a fourth face", () => {
    for (const { selector, body } of cssRules()) {
      const font = body.match(/font(?:-family)?:([^;]+)/)?.[1];
      if (!font) continue;
      expect(font, selector).toMatch(/var\(--(sans|mono)\)/);
    }
    expect(HOME_FILES.map(read).join("\n")).not.toMatch(/Rajdhani|Oswald/i);
  });

  it("keeps Inter display tracking inside the approved −0.055 to −0.065em", () => {
    const display = cssRules().filter(({ selector }) =>
      /\.line\b|\.say\b/.test(selector),
    );
    const values = display
      .map(({ body }) => body.match(/letter-spacing:\s*(-?[\d.]+)em/)?.[1])
      .filter((value): value is string => Boolean(value))
      .map(Number);
    expect(values.length).toBeGreaterThan(3);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(-0.065);
      expect(value).toBeLessThanOrEqual(-0.055);
    }
  });

  it("uses orange only for the hero dot and the code-field ring, both on near-black", () => {
    const orange = cssRules()
      .filter(({ body }) => /--signal|#ff4f00|255 79 0/i.test(body))
      .map(({ selector }) => selector);
    expect(orange).toEqual([".home-e2 .dot"]);
    const ring = cssRules().find(
      ({ selector }) => selector === ".home-e2 .frow:focus-within",
    );
    expect(ring?.body).toMatch(/0 0 0 4px var\(--cream\)/);
    expect(ring?.body).not.toMatch(/--signal/);

    const dot = cssRules().find(({ selector }) => selector === ".home-e2 .dot");
    expect(dot?.body).not.toMatch(/box-shadow|filter|blur/);
    expect(read("src/components/home-hero.tsx")).toMatch(/className="dot"/);
    expect(read("src/components/home-plates.tsx")).toMatch(
      /className="plate enter"[\s\S]*className="frow"/,
    );
    const enter = cssRules().find(
      ({ selector }) => selector === ".home-e2 .enter",
    );
    expect(enter?.body).toMatch(/background: var\(--base\)/);
  });

  it("draws the approved outline 1 and nothing else in outline", () => {
    const stroked = cssRules()
      .filter(({ body }) => /text-stroke/.test(body))
      .map(({ selector }) => selector);
    expect(stroked).toEqual([".home-e2 .n1 b"]);
    expect(HOME_POINTS.map((point) => point.label)).toEqual([
      "1 point",
      "2 points",
    ]);
  });

  it("keeps texture, fleck and glow off every site surface", () => {
    const sources = walk(SRC, /\.(tsx?|css)$/).filter(
      (file) => !/\.test\.tsx?$/.test(file),
    );
    const hits = sources.filter((file) =>
      /fleck|noise\.svg/i.test(readFileSync(file, "utf8")),
    );
    expect(hits).toEqual([]);
    expect(walk(PUBLIC, /fleck|texture|noise/i)).toEqual([]);

    for (const relative of HOME_FILES) {
      expect(read(relative)).not.toMatch(/url\(|bg-\[url|mix-blend|filter:/);
    }
  });

  it("removes the P1 frame, crops and QR", () => {
    expect(existsSync(join(PUBLIC, "frames"))).toBe(false);
    expect(existsSync(join(PUBLIC, "hero"))).toBe(false);
    for (const gone of [
      "components/cover-frame.tsx",
      "components/home-spec-plate.tsx",
      "components/home-library.tsx",
      "components/home-unlocks.tsx",
      "components/home-qr.tsx",
      "lib/qr.ts",
    ]) {
      expect(existsSync(join(SRC, gone)), gone).toBe(false);
    }
  });
});

describe("Home copy", () => {
  it("speaks to you, without hype", () => {
    const joined = [
      HOME_HERO_COPY.lede,
      HOME_ENTER_COPY.lead,
      HOME_ENTER_COPY.register,
      ...HOME_POINTS.map((point) => point.text),
    ].join(" ");
    expect(joined).not.toMatch(/!/);
    expect(joined.toLowerCase()).not.toMatch(/\bwe\b|\bour\b|free|prize/);
  });

  it("keeps the points copy word for word: 1 for a code, 2 with a scan", () => {
    expect(HOME_POINTS).toEqual([
      { value: "1", label: "1 point", text: "The code on its own" },
      {
        value: "2",
        label: "2 points",
        text: "The code, plus a scan of the page you colored",
      },
    ]);
  });
});
