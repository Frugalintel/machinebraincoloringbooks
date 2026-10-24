import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MOCK_CATALOG } from "@/__tests__/store-catalog";
import {
  STORE_COPY,
  PRODUCT_COPY,
  bookName,
  coverFor,
  filterByWorld,
  labelForWorld,
  parseWorldParam,
  displayEm,
  fittedEms,
  mobileTitleLines,
  plateBackground,
  plateSentence,
  plateCode,
  productDescription,
  shelfBasis,
  shortSpec,
  volumeLabel,
  productGallery,
  storeHref,
  storeShowsSamples,
  storeWorlds,
  worldSlug,
} from "@/lib/store";

const byName = (name: string) =>
  MOCK_CATALOG.find((product) => product.subtitle === name)!;

describe("store worlds and the ?world= filter", () => {
  it("lists the worlds in the data, A to Z, once each", () => {
    expect(storeWorlds(MOCK_CATALOG).map((world) => world.label)).toEqual([
      "Classics",
      "Fantasy",
      "Holiday",
      "Horror",
      "Nature",
      "Nostalgia",
      "Sci-fi",
      "Vintage",
    ]);
  });

  it("filters by category slug, and by title like the old chips did", () => {
    expect(filterByWorld(MOCK_CATALOG, "sci-fi").map(bookName)).toEqual([
      "Star Drifter",
      "Iron Giant",
    ]);
    expect(filterByWorld(MOCK_CATALOG, "mecha").map(bookName)).toEqual([
      "Iron Giant",
    ]);
    expect(filterByWorld(MOCK_CATALOG, "surreal")).toEqual([]);
    expect(filterByWorld(MOCK_CATALOG, null)).toHaveLength(9);
  });

  it("parses and builds world URLs", () => {
    expect(worldSlug("SCI-FI")).toBe("sci-fi");
    expect(parseWorldParam(" Sci-Fi ")).toBe("sci-fi");
    expect(parseWorldParam("")).toBeNull();
    expect(parseWorldParam(null)).toBeNull();
    expect(storeHref("sci-fi")).toBe("/store?world=sci-fi");
    expect(storeHref(null)).toBe("/store");
    expect(labelForWorld("sci-fi", storeWorlds(MOCK_CATALOG))).toBe("Sci-fi");
    expect(labelForWorld("deep-sea", [])).toBe("Deep sea");
  });

  it("names books by their own name, never in all caps", () => {
    expect(bookName(byName("Realm Walker"))).toBe("Realm Walker");
    expect(bookName({ title: "FLORA", subtitle: "" })).toBe("Flora");
    expect(plateCode(0)).toBe("Pl. 01a");
    expect(plateCode(8)).toBe("Pl. 01i");
  });

  it("fits every plate title from the longest line, about the sample's 11.06vw", () => {
    const deep = displayEm("Into the Deep Forest");
    expect(deep).toBeCloseTo(20 * 0.5 + 19 * -0.06, 5);
    const fitted = fittedEms([
      { one: "The Far Station", lines: ["The Far", "Station"] },
      { one: "Into the Deep Forest", lines: ["Into the", "Deep Forest"] },
      { one: "The Wandering Keep", lines: ["The Wandering", "Keep"] },
    ]);
    expect(fitted.desktop).toBeCloseTo(deep, 5);
    expect(fitted.mobile).toBeCloseTo(displayEm("The Wandering"), 5);
    const at1440 = ((1440 - 80) / deep / 1440) * 100;
    expect(at1440).toBeGreaterThan(10);
    expect(at1440).toBeLessThan(12);
  });

  it("builds the short spec from the fields that exist", () => {
    expect(shortSpec({})).toBeUndefined();
    expect(shortSpec({ trim: "8 × 10 in" })).toBe("8 × 10 in");
    expect(
      shortSpec({ pages: 50, trim: "8.5 × 11 in", binding: "Paperback" }),
    ).toBe("50 plates · 8.5 × 11 in · Paperback");
    expect(mobileTitleLines(undefined)).toBeUndefined();
    expect(mobileTitleLines("Realm\nWalker")).toEqual(["Realm", "Walker"]);
    expect(volumeLabel(5)).toBe("Vol 06");
    expect(plateSentence("One sentence. And another.")).toBe("One sentence.");
  });

  it("shrinks the shelf so every cover fits, and never past the six-up width", () => {
    expect(shelfBasis(6)).toBe(
      "min(var(--shelf-six), calc((100% - 5 * var(--shelf-gap)) / 6))",
    );
    expect(shelfBasis(9)).toBe(
      "min(var(--shelf-six), calc((100% - 8 * var(--shelf-gap)) / 9))",
    );
    expect(shelfBasis(2)).toContain("var(--shelf-six)");
    expect(shelfBasis(0)).toBe(shelfBasis(1));
  });
});

describe("cover art and the SAMPLE switch", () => {
  it("follows Home's switch: samples everywhere except Vercel production", () => {
    expect(storeShowsSamples("production")).toBe(false);
    expect(storeShowsSamples("preview")).toBe(true);
    expect(storeShowsSamples(undefined)).toBe(true);
  });

  it("letters every book in production, Realm Walker included, with no borrowed art", () => {
    for (const product of MOCK_CATALOG) {
      expect(coverFor(product, false)).toEqual({ kind: "plate" });
    }
    expect(coverFor(byName("Realm Walker"), true)).toEqual({ kind: "plate" });
    expect(plateBackground(byName("Realm Walker"), true)).toBeNull();
    expect(plateBackground(byName("Star Drifter"), false)).toBeNull();
    expect(plateBackground(byName("Star Drifter"), true)).toMatch(
      /^\/home\/sample\//,
    );
  });

  it("uses Studio's SAMPLE covers on previews, labelled, and only from the sample folder", () => {
    const samples = MOCK_CATALOG.map((product) => coverFor(product, true));
    const sampled = samples.filter(
      (cover) => cover.kind === "art" && cover.art.sample,
    );
    expect(sampled.length).toBeGreaterThan(0);
    for (const cover of sampled) {
      if (cover.kind !== "art") continue;
      expect(cover.art.src.startsWith("/home/sample/")).toBe(true);
      expect(cover.art.alt.toLowerCase()).toContain("sample");
      expect(existsSync(join(process.cwd(), "public", cover.art.src))).toBe(
        true,
      );
    }
    expect(coverFor(byName("The Origin"), true)).toEqual({ kind: "plate" });
    expect(coverFor(byName("Retrowave"), true)).toEqual({ kind: "plate" });
  });

  it("prefers a real upload over any fallback", () => {
    const withArt = {
      ...byName("Flora"),
      image_url: "https://x.supabase.co/a.png",
    };
    for (const samples of [true, false]) {
      expect(coverFor(withArt, samples)).toMatchObject({
        kind: "art",
        art: { src: withArt.image_url, remote: true, sample: false },
      });
    }
  });

  it("builds the product gallery from real art, plus a SAMPLE world plate on previews", () => {
    expect(productGallery(byName("Realm Walker"), false)).toHaveLength(1);
    expect(productGallery(byName("Realm Walker"), true)).toHaveLength(1);
    expect(productGallery(byName("Star Drifter"), false)).toHaveLength(1);
    const preview = productGallery(byName("Star Drifter"), true);
    expect(preview.map((item) => item.key)).toEqual(["cover", "world"]);
  });

  it("describes a book from the data, without invented claims", () => {
    expect(productDescription(byName("Flora"))).toBe(
      "Flora, a nature coloring book from Machine Brain.",
    );
    expect(
      productDescription({ ...byName("Flora"), description: "From the row." }),
    ).toBe("From the row.");
  });
});

describe("store copy", () => {
  it("speaks to you, in sentence case, without hype or invented claims", () => {
    const strings = [
      ...Object.values(STORE_COPY).flatMap((value) =>
        typeof value === "string" ? [value] : Object.values(value),
      ),
      ...Object.values(PRODUCT_COPY),
    ];
    const joined = strings.join(" ");
    expect(joined).not.toMatch(/!/);
    expect(joined.toLowerCase()).not.toMatch(
      /\bwe\b|\bour\b|free|prize|in stock|ships|bestsell|\d+ pages|rated|stars?\b/,
    );
    for (const text of strings) {
      const words = text.split(/\s+/);
      const capitalised = words.filter(
        (word, index) =>
          index > 0 &&
          !words[index - 1].endsWith(".") &&
          /^[A-Z][a-z]/.test(word) &&
          word !== "Sample",
      );
      expect(capitalised, text).toEqual([]);
    }
  });
});
