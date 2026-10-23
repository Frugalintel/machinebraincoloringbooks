/**
 * Home page copy and cover-system constants.
 * Voice: invite, speak as "you", no exclamation marks, no counts/prizes/guarantees.
 */

export const FRAME_PORTRAIT_SRC = "/frames/frame-portrait-cream.png";
export const FRAME_PORTRAIT_WIDTH = 1200;
export const FRAME_PORTRAIT_HEIGHT = 1553;
/** Fern ornaments live in the outer band; keep the window inside the opening. */
export const FRAME_WINDOW_INSET = "14% 16.4%";

/** Portrait full-color art already in the repo. Catalog rows have no image_url. */
export const HERO_FALLBACK_COVER = "/stories/neon-dreams.png";

export const HOME_UNLOCK_STEPS = [
  {
    number: "01",
    label: "Scan the code",
    copy: "The QR on the back of your book opens the unlock.",
  },
  {
    number: "02",
    label: "Scan your colored pages to earn points",
    copy: "Photograph a page after you color it.",
  },
  {
    number: "03",
    label: "Spend points on more unlocks",
    copy: "Use what you earn to open the next thing you find.",
  },
] as const;

export const HOME_HERO_COPY = {
  brandEyebrow: "Coloring books",
  headlineWhite: "Color",
  headlineAccent: "the machine",
  subcopy:
    "Look closer. Hidden parts wait in the lines, and a code on the back opens what you find.",
  primaryCta: { label: "Browse books", href: "/store" },
  secondaryCta: { label: "How it works", href: "#how-it-works" },
} as const;

export const HOME_HOW_IT_WORKS_COPY = {
  eyebrow: "How it works",
  heading: "From the back of your book",
} as const;

export const HOME_FEATURED_COPY = {
  eyebrow: "Catalog",
  heading: "Books",
  allLabel: "See all books",
  collectionsEyebrow: "Collections",
} as const;

export const HOME_CLOSE_COPY = {
  eyebrow: "Look closer",
  heading: "A book, or a code you already have",
  body: "Browse the books, or scan a code if one is already in your hands.",
  primary: { label: "Browse books", href: "/store" },
  secondary: { label: "Scan a code", href: "/scan" },
} as const;
