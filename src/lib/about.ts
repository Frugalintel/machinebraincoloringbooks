/**
 * About A · Spread: locked plate copy. Voice: "you", no exclamation marks,
 * no counts, prizes or guarantees. The studio note stays a marked placeholder.
 */
import {
  HOME_ART,
  HOME_HERO_COPY,
  HOME_ROUTES,
  SAMPLE_BOOKS,
} from "@/lib/home";

export const ABOUT_ROUTES = {
  books: HOME_ROUTES.books,
  codes: `${HOME_ROUTES.help}#codes`,
} as const;

export const ABOUT_ART = {
  line: {
    src: "/about/plate-line-ink.webp",
    width: 1400,
    height: 2081,
  },
  color: HOME_ART.color,
  glasshouse: {
    src: "/about/greenhouse-wide.webp",
    width: 1920,
    height: 1080,
  },
} as const;

export const ABOUT_HERO_COPY = {
  plate: "PL. 00",
  label: "About",
  lines: ["Drawn in line.", "Finished by you."] as const,
  mobileLines: ["Drawn", "in line.", "Finished", "by you."] as const,
  lede: HOME_HERO_COPY.lede,
  cap: "The Silver Citadel \u00b7 Plate 07 \u00b7 as printed / as colored",
  splitLabel:
    "Plate 07 of The Silver Citadel: the left half as printed in line, the right half colored (sample)",
  splitCaps: ["Line \u00b7 as printed", "Color \u00b7 yours"] as const,
} as const;

export const ABOUT_REST_COPY = {
  line: "Nothing here moves.",
  lineMobile: ["Nothing", "here moves."] as const,
  second: ["Everything rewards", "a second look."] as const,
  secondMobile: ["Everything", "rewards a", "second look."] as const,
  body: "The wonder of seeing how something works, and of finding more the longer you\u00a0look.",
} as const;

export const ABOUT_PRINCIPLES = [
  {
    n: "01",
    title: "Fine, patient line",
    body: "Clean lines and open space, drawn to be colored slowly. The weight of the line changes from world to world. The finish does\u00a0not.",
  },
  {
    n: "02",
    title: "The machine is in the frame",
    body: "Covers, plate numbers and matter pages carry the technical marks: numbered callouts, thin rules, a monospace label. The art itself stays free for your\u00a0color.",
  },
  {
    n: "03",
    title: "A second look",
    body: "Every book hides something: inner workings, a small surprise, and one page that is different in your copy from anyone else\u2019s.",
  },
] as const;

export const ABOUT_PRINCIPLES_COPY = {
  heading: "What goes into a book",
  mark: "The mark \u00b7 one ink, always",
} as const;

export const ABOUT_WORLDS_COPY = {
  heading: "Each book is one world.",
  lead: "With its own light, places and small surprises.",
  sampleNote: "Titles, covers and art \u00b7 Sample",
} as const;

export const ABOUT_BEYOND_COPY = {
  lines: ["The book", "opens onto", "more."] as const,
  body: "The code on the back cover and the codes at the foot of each page lead further in: a collectible drawn for your copy, a trophy that grows as you color, and stories. A code is +1 point; a verified photo is +1 more.",
  primary: { label: "See the books", href: ABOUT_ROUTES.books },
  codes: { label: "How codes and points work", href: ABOUT_ROUTES.codes },
  artAlt: "A glasshouse at dusk (sample world art)",
} as const;

export const ABOUT_STUDIO_COPY = {
  heading: "The studio",
  label: "Placeholder \u00b7 Studio note \u00b7 Jayden to write",
  body: "Who makes the books, and where. Two or three quiet sentences in the same voice. No names, dates or history are invented on this page.",
} as const;

export const ABOUT_SAMPLE_BOOKS = SAMPLE_BOOKS;
