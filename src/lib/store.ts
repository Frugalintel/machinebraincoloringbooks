/**
 * Store (/store, /store/[id]): copy, world filter and cover art rules.
 * Voice: "you", no exclamation marks, no counts, prizes, ratings or stock claims.
 */
import { toSentenceCase } from "@/lib/display-text";
import {
  COVER_SIZE,
  HOME_WORLDS,
  SAMPLE_BOOKS,
  homeShowsSamples,
} from "@/lib/home";
import type { Product } from "@/lib/types";

/** Same switch as Home: SAMPLE art on previews and local builds only. */
export const storeShowsSamples = homeShowsSamples;

export const STORE_WORLD_PARAM = "world";

export const STORE_COPY = {
  label: "Store",
  title: "All books",
  lede: "Each book is one world, drawn in fine, patient line. Start with the one that pulls you\u00a0in.",
  worldsLabel: "World",
  allWorlds: "All",
  addToCart: "Add to cart",
  sampleNote: "Cover art · Sample",
  sampleTag: "Sample",
  loading: "Loading",
  empty: {
    title: "No books in this world yet",
    body: "Try another world, or see every book in the store.",
    cta: "See all books",
  },
  loadFailed: {
    title: "The live catalog did not load",
    body: "You are looking at the saved list of books. Try again to load the current one.",
    retry: "Try again",
  },
} as const;

export const PRODUCT_COPY = {
  breadcrumb: "Breadcrumb",
  allBooks: "All books",
  galleryLabel: "Images of the book",
  details: "Details",
  world: "World",
  age: "Age",
  difficulty: "Difficulty",
  addToCart: "Add to cart",
  price: "Price",
  was: "Was",
} as const;

export type StoreWorld = { slug: string; label: string };

export function worldSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function worldLabel(category: string): string {
  return toSentenceCase(category.trim());
}

/** The book's own name: the catalog keeps the world in `title`. */
export function bookName(product: Pick<Product, "title" | "subtitle">): string {
  return toSentenceCase(product.subtitle?.trim() || product.title);
}

/** Worlds present in the data, A to Z so the filter order is stable. */
export function storeWorlds(products: readonly Product[]): StoreWorld[] {
  const bySlug = new Map<string, StoreWorld>();
  for (const product of products) {
    const slug = worldSlug(product.category ?? "");
    if (slug && !bySlug.has(slug)) {
      bySlug.set(slug, { slug, label: worldLabel(product.category) });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Mirrors the old chips: a world matches the category or the title. */
export function filterByWorld(
  products: readonly Product[],
  slug: string | null,
): Product[] {
  if (!slug) return [...products];
  return products.filter(
    (product) =>
      worldSlug(product.category ?? "") === slug ||
      worldSlug(product.title) === slug,
  );
}

export function parseWorldParam(
  value: string | null | undefined,
): string | null {
  const slug = worldSlug(value ?? "");
  return slug || null;
}

export function labelForWorld(
  slug: string,
  worlds: readonly StoreWorld[],
): string {
  const known = worlds.find((world) => world.slug === slug);
  if (known) return known.label;
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function storeHref(slug: string | null): string {
  return slug
    ? `/store?${STORE_WORLD_PARAM}=${encodeURIComponent(slug)}`
    : "/store";
}

/**
 * One shelf track: every cover fits the row, and none grows past the
 * six-up width (five 16px gaps). The count comes from the catalog.
 */
export function shelfBasis(count: number): string {
  const n = Math.max(1, Math.floor(count));
  return `min(var(--shelf-six), calc((100% - ${n - 1} * var(--shelf-gap)) / ${n}))`;
}

const PLATE_LETTERS = "abcdefghijklmnopqrstuvwxyz";

/** Home numbers its books Pl. 01a–e; the store continues the same scheme. */
export function plateCode(index: number): string {
  return index < PLATE_LETTERS.length
    ? `Pl. 01${PLATE_LETTERS[index]}`
    : `Pl. 01.${index + 1}`;
}

export type StoreArt = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Product uploads may live on hosts next/image is not configured for. */
  remote: boolean;
  sample: boolean;
};

export type StoreCover = { kind: "art"; art: StoreArt } | { kind: "plate" };

/**
 * Preview only: which of Studio's SAMPLE worlds stands in for a catalog world.
 * Worlds with no close match keep the typographic plate on previews too.
 */
export const SAMPLE_WORLD_FOR: Readonly<Record<string, string>> = {
  "sci-fi": "Sci-Fi",
  nature: "Wildlife",
  vintage: "Cozy",
  holiday: "Cozy",
  horror: "Surreal",
};

function sampleFor(product: Pick<Product, "category">) {
  const world = SAMPLE_WORLD_FOR[worldSlug(product.category ?? "")];
  if (!world) return null;
  const book = SAMPLE_BOOKS.find((entry) => entry.world === world);
  const plate = HOME_WORLDS.find((entry) => entry.name === world);
  if (!book || !plate || !book.cover.startsWith("/home/sample/")) return null;
  return { world, book, plate };
}

/**
 * A real upload wins, then (previews only) Studio's SAMPLE cover, else the
 * lettered plate. No book borrows another book's art on production.
 */
export function coverFor(
  product: Pick<Product, "title" | "subtitle" | "category" | "image_url">,
  samples: boolean,
): StoreCover {
  const name = bookName(product);
  if (product.image_url) {
    return {
      kind: "art",
      art: {
        src: product.image_url,
        alt: `${name}, front cover`,
        ...COVER_SIZE,
        remote: true,
        sample: false,
      },
    };
  }
  const sample = samples ? sampleFor(product) : null;
  if (sample) {
    return {
      kind: "art",
      art: {
        src: sample.book.cover,
        alt: `Sample cover art standing in for ${name} (Studio's ${sample.world} sample, ${sample.book.title})`,
        ...COVER_SIZE,
        remote: false,
        sample: true,
      },
    };
  }
  return { kind: "plate" };
}

export type GalleryItem = {
  key: string;
  label: string;
  cover: StoreCover;
};

/** Cover first, then a SAMPLE world plate on previews. */
export function productGallery(
  product: Pick<Product, "title" | "subtitle" | "category" | "image_url">,
  samples: boolean,
): GalleryItem[] {
  const items: GalleryItem[] = [
    { key: "cover", label: "Cover", cover: coverFor(product, samples) },
  ];
  const sample = samples ? sampleFor(product) : null;
  if (sample) {
    items.push({
      key: "world",
      label: "World plate",
      cover: {
        kind: "art",
        art: {
          src: sample.plate.art,
          alt: `Sample world plate (Studio's ${sample.world} sample art)`,
          width: 1400,
          height: 2081,
          remote: false,
          sample: true,
        },
      },
    });
  }
  return items;
}

export function productDescription(
  product: Pick<Product, "title" | "subtitle" | "category" | "description">,
): string {
  return (
    product.description?.trim() ||
    `${bookName(product)}, a ${worldLabel(product.category ?? "").toLowerCase()} coloring book from Machine Brain.`
  );
}
