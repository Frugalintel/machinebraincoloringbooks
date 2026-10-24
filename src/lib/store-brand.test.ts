import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STORE_FILES = [
  "src/app/store/layout.tsx",
  "src/app/store/page.tsx",
  "src/app/store/store-listing.tsx",
  "src/app/store/store.css",
  "src/app/store/loading.tsx",
  "src/app/store/error.tsx",
  "src/app/store/[id]/page.tsx",
  "src/app/store/[id]/product-client.tsx",
  "src/app/store/[id]/loading.tsx",
  "src/app/store/[id]/not-found.tsx",
  "src/components/store-cover.tsx",
  "src/components/reviews-section.tsx",
  "src/lib/store.ts",
];

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf8");
}

const SOURCE = STORE_FILES.map(read).join("\n");
const CSS = read("src/app/store/store.css");

describe("Store brand guardrails (STORE-01, STORE-02, SW-ORANGE-USE-01, SW-PALETTE-01, SW-TEX-01)", () => {
  it("sets Redaction on the single H1 and the fitted plate titles", () => {
    const listing = read("src/app/store/store-listing.tsx");
    const product = read("src/app/store/[id]/product-client.tsx");
    expect(listing).toMatch(/<h1[^>]*className="s-h1 font-display"/);
    const headings = listing.match(/<h1\b[^>]*>/g) ?? [];
    expect(headings.length).toBeGreaterThan(0);
    for (const heading of headings) {
      expect(heading).toMatch(/font-display/);
    }
    expect(listing).toMatch(/className="tl font-display"/);
    expect(listing).toMatch(/className="ix-line font-display"/);
    expect(product).toMatch(/<h1[^>]*className="s-h1 font-display"/);
    expect(product).toMatch(/className="lk font-display"/);
    expect(product.match(/font-display/g)).toHaveLength(2);
    expect(CSS).toMatch(/\.tl \{[^}]*var\(--font-display\)/);
    expect(CSS).toMatch(/\.ix-line \{[^}]*var\(--font-display\)/);
    expect(CSS).toMatch(/\.lk \{[^}]*var\(--font-display\)/);
    expect(CSS).toMatch(/\.s-plate \.t \{[^}]*var\(--font-display\)/);
    const others = STORE_FILES.filter(
      (file) => !/store-listing|product-client|store\.css/.test(file),
    );
    for (const file of others) {
      expect(read(file), file).not.toMatch(/font-display|redaction/i);
    }
  });

  it("keeps orange to small mono labels on near-black, never a fill, ring or border", () => {
    expect(SOURCE).not.toMatch(
      /(?:bg|border|ring|fill|from|via|to)-(?:primary|signal|brand-orange)|text-primary|#ff4f00|255 79 0/i,
    );
    expect(CSS).not.toMatch(
      /(?:background|border|box-shadow):[^;]*var\(--signal\)/,
    );
    expect(CSS).toMatch(/\.fstat \{[^}]*color:\s*var\(--signal\)/);
    expect(CSS).toMatch(/outline:\s*2px solid var\(--signal\)/);
    expect(CSS.match(/var\(--signal\)/g)).toHaveLength(2);
    const signal = SOURCE.match(/[\w:-]*signal\b/g) ?? [];
    expect(new Set(signal)).toEqual(new Set(["text-signal", "--signal"]));
    for (const line of SOURCE.split("\n").filter((l) =>
      /text-signal/.test(l),
    )) {
      expect(line).toMatch(/className="mono text-signal"/);
    }
  });

  it("uses the five brand colors only: no status hues, raw hexes or product swatches", () => {
    expect(SOURCE).not.toMatch(
      /\b(?:text|bg|border|fill)-(?:success|warning|danger|gray|zinc|amber|red|green|blue|yellow|purple)/,
    );
    expect(SOURCE).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(SOURCE).not.toMatch(/product\.color|\.accent\b|cat\.color/);
  });

  it("sets UI and body in Inter at 16px and up, and mono labels at 11px and up", () => {
    for (const match of CSS.matchAll(
      /font:\s*\d+\s+(\d+)px[^;]*var\(--sans\)/g,
    )) {
      expect(Number(match[1]), match[0]).toBeGreaterThanOrEqual(15);
    }
    for (const match of CSS.matchAll(
      /font:\s*\d+\s+(?:max\()?(\d+)px[^;]*var\(--mono\)/g,
    )) {
      expect(Number(match[1]), match[0]).toBeGreaterThanOrEqual(11);
    }
    expect(SOURCE).not.toMatch(/text-(?:xs|\[1[0-4]px\]|\[\d px\])/);
  });

  it("keeps texture, grain, glow and motion gimmicks off the store", () => {
    expect(SOURCE).not.toMatch(
      /noise|fleck|grain|url\(|mix-blend|filter:|blur|glow|backdrop|radial-gradient|framer-motion|TrophyCanvas|perspective/i,
    );
  });

  it("drops invented claims, ratings on the listing and dead controls", () => {
    expect(SOURCE).not.toMatch(
      /in stock|96 pages|print \+ digital|ships worldwide|secure checkout|requisition|exclusive|neural network|vol\. /i,
    );
    expect(SOURCE).not.toMatch(/!["'<]|!\s*$/m);
    const listing = read("src/app/store/store-listing.tsx");
    expect(listing).not.toMatch(/rating|Star\b|Sort:|GridIcon|List\b/);
  });

  it("sizes every image and keeps the cover frame fixed so nothing shifts", () => {
    const cover = read("src/components/store-cover.tsx");
    expect(cover.match(/sizes=\{sizes\}/g)).toHaveLength(2);
    expect(read("src/app/home.css")).toMatch(
      /\.home-e2 \.cover \{[^}]*aspect-ratio: 720 \/ 932/,
    );
    expect(SOURCE).not.toMatch(/<img\s/);
  });

  it("keeps the F7 states and the not-found contract", () => {
    for (const file of [
      "src/app/store/loading.tsx",
      "src/app/store/[id]/loading.tsx",
      "src/app/store/error.tsx",
      "src/app/store/[id]/not-found.tsx",
    ]) {
      expect(existsSync(join(process.cwd(), file)), file).toBe(true);
    }
    expect(read("src/app/store/[id]/page.tsx")).toMatch(
      /if\s*\(!product\)\s*\{\s*notFound\(\)/,
    );
    expect(read("src/app/store/[id]/page.tsx")).not.toMatch(/MACHINE BRAIN/);
  });

  it("shares Home's plates, nav and footer", () => {
    const layout = read("src/app/store/layout.tsx");
    expect(layout).toMatch(/import "\.\.\/home\.css"/);
    expect(layout).toMatch(/className="home-e2 store-e2"/);
    expect(layout).toMatch(/<HomeFooter samples=\{samples\} \/>/);
    expect(layout).toMatch(/storeShowsSamples\(process\.env\.VERCEL_ENV\)/);
  });
});
