/**
 * Home page copy and cover-system constants.
 * Voice: invite, speak as "you", no exclamation marks, no counts/prizes/guarantees.
 */

/**
 * Canonical book-cover frame (Studio site-home-p1, front portrait).
 * All geometry is in the SVG's 1700×2200 viewBox units.
 */
export const COVER_FRAME = {
  width: 1700,
  height: 2200,
  /** Emblem, brackets, FANTASY label and the four side rails. */
  fullSrc: "/frames/frame-front-web-full.svg",
  /** Light rule closed, no emblem or rails. Used at tile size. */
  closedSrc: "/frames/frame-front-web-closed.svg",
  /** Inner window rule: the art box. */
  window: { x: 140, y: 614, width: 1420, height: 1310 },
  titleBand: { y: 270, height: 300 },
  /** Between the window rule (1940) and the light rule (2124). */
  footerBand: { y: 1940, height: 184 },
} as const;

export type CoverFrameVariant = "full" | "closed";

export function coverFrameSrc(variant: CoverFrameVariant): string {
  switch (variant) {
    case "full":
      return COVER_FRAME.fullSrc;
    case "closed":
      return COVER_FRAME.closedSrc;
    default: {
      const _exhaustive: never = variant;
      throw new Error(`Unhandled cover frame variant: ${String(_exhaustive)}`);
    }
  }
}

/** Inner stepped window rule (README "Art clip"), clockwise from top-left. */
export const COVER_WINDOW_POLYGON: ReadonlyArray<readonly [number, number]> = [
  [140, 666],
  [166, 666],
  [166, 640],
  [192, 640],
  [192, 614],
  [1508, 614],
  [1508, 640],
  [1534, 640],
  [1534, 666],
  [1560, 666],
  [1560, 1872],
  [1534, 1872],
  [1534, 1898],
  [1508, 1898],
  [1508, 1924],
  [192, 1924],
  [192, 1898],
  [166, 1898],
  [166, 1872],
  [140, 1872],
];

function percent(value: number, total: number): string {
  return `${Number(((value / total) * 100).toFixed(4))}%`;
}

/** The stepped window as a CSS polygon relative to the window box. */
export function coverWindowClipPath(): string {
  const { x, y, width, height } = COVER_FRAME.window;
  const points = COVER_WINDOW_POLYGON.map(
    ([px, py]) => `${percent(px - x, width)} ${percent(py - y, height)}`,
  );
  return `polygon(${points.join(", ")})`;
}

/** A band of the frame as absolute-position percentages of the frame box. */
export function coverBandStyle(band: { y: number; height: number }): {
  top: string;
  height: string;
} {
  return {
    top: percent(band.y, COVER_FRAME.height),
    height: percent(band.height, COVER_FRAME.height),
  };
}

export function coverWindowStyle(): {
  left: string;
  top: string;
  width: string;
  height: string;
  clipPath: string;
} {
  const { x, y, width, height } = COVER_FRAME.window;
  return {
    left: percent(x, COVER_FRAME.width),
    top: percent(y, COVER_FRAME.height),
    width: percent(width, COVER_FRAME.width),
    height: percent(height, COVER_FRAME.height),
    clipPath: coverWindowClipPath(),
  };
}

export type HeroCropId = "H1" | "H2" | "H3";

export type HeroCrop = {
  src: string;
  alt: string;
};

/** Studio crops of the approved cover art, all at the window aspect 1420:1310. */
export const HERO_CROPS: Record<HeroCropId, HeroCrop> = {
  H1: {
    src: "/hero/hero-H1-1200.webp",
    alt: "A rusted cable car tipped into fireweed under a ruined glasshouse, with a Ferris wheel behind it",
  },
  H2: {
    src: "/hero/hero-H2-1200.webp",
    alt: "A Ferris wheel rising behind the broken roof of an overgrown glasshouse",
  },
  H3: {
    src: "/hero/hero-H3-1200.webp",
    alt: "Close view of a rusted cable car resting in fireweed and mist",
  },
};

/** Switch the hero art here. H1 is the exact locked-front crop. */
export const HERO_CROP: HeroCropId = "H1";

export const HERO_ART: HeroCrop = HERO_CROPS[HERO_CROP];

export const HOME_HERO_COPY = {
  title: "Look Closer",
  eyebrowAccent: "Vol 01",
  eyebrowRest: ["Series Genesis", "Est 2026"],
  tagline: "Look closer: every plate hides a working part.",
  body: "You color a ruined citadel of glass, rust and fireweed. Look past the leaves and you find a cable car still on its line, a wheel that still turns and a door left open.",
  primaryCta: { label: "Browse the books", href: "/store" },
  secondaryCta: { label: "How unlocks work", href: "#unlocks" },
} as const;

export const HOME_HERO_CALLOUTS = [
  { label: "Plate 01", value: "Cable car · Fig. 01" },
  { label: "Format", value: "8.5×11 in · Single-sided" },
] as const;

/** Live L3 plate. Fields with no real value yet are omitted, not filled. */
export const HOME_SPEC_PLATE = {
  caption: "Spec plate",
  rows: [
    { label: "Series", value: "Genesis" },
    { label: "Spec", value: "8.5×11 in · Single-sided" },
    { label: "Unlock", value: "One QR · Back cover" },
  ],
} as const;

export const HOME_LIBRARY_COPY = {
  heading: "Next in the Machine Brain library",
  limit: 4,
} as const;

export const HOME_UNLOCKS_COPY = {
  label: "Unlocks",
  heading: "Your book opens more than its pages.",
  qrPath: "/scan",
  qrCaption: "Scan · Unlock + see paired books",
} as const;

export const HOME_UNLOCK_STEPS = [
  { number: "01", label: "Scan the code" },
  { number: "02", label: "Scan your colored pages to earn points" },
  { number: "03", label: "Spend points on more unlocks" },
] as const;
