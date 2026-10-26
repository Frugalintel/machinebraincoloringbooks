/**
 * Home (Studio R-E2 p3 "Art book"): plate copy, routes and the SAMPLE switch.
 * Voice: "you", no exclamation marks, no counts, prizes or guarantees.
 */

/**
 * SAMPLE content (sample covers and titles, AI world plates, the "••••" code
 * format, the newsletter form) shows on previews and local builds only.
 */
export function homeShowsSamples(vercelEnv: string | undefined): boolean {
  return vercelEnv !== "production";
}

/** Studio's guessed routes, mapped onto routes that exist in this app. */
export const HOME_ROUTES = {
  books: "/store",
  worlds: "/store",
  world: "/store",
  about: "/about",
  stories: "/stories",
  collectibles: "/collectibles",
  trophyRoom: "/trophy-room",
  scan: "/scan",
  enterCode: "/scan?mode=code",
  help: "/help",
  privacy: "/privacy",
  terms: "/terms",
  licenses: "/licenses",
  signIn: "/auth?mode=login",
  register: "/auth?mode=register",
  orders: "/orders/lookup",
} as const;

export const HOME_ART = {
  heroDesktop: {
    src: "/home/o3-desk.webp",
    width: 2880,
    height: 1800,
  },
  heroMobile: {
    src: "/home/o3-mob.webp",
    width: 1170,
    height: 1404,
  },
  heroAlt: "The Silver Citadel coloring book, standing open in low lamp light",
  page: {
    src: "/home/page-line.webp",
    width: 1391,
    height: 1800,
  },
  lineCream: {
    src: "/home/plate-line-cream.webp",
    width: 1400,
    height: 2081,
  },
  color: {
    src: "/home/plate-color.webp",
    width: 1400,
    height: 2081,
  },
} as const;

export const HOME_HERO_COPY = {
  lines: ["Look", "closer."],
  lede: "Coloring books drawn in fine, patient line. Open one and take your\u00a0time.",
  primary: { label: "Shop the books", href: HOME_ROUTES.books },
  secondary: { label: "Look inside", href: HOME_ROUTES.world },
  plate: "Pl. 00",
  plateTitle: "The Silver Citadel",
} as const;

export type SampleBook = {
  plate: string;
  title: string;
  world: string;
  detail: string;
  cover: string;
};

/** SAMPLE: titles and the four non-Fantasy covers are Studio composites. */
export const SAMPLE_BOOKS: readonly SampleBook[] = [
  {
    plate: "Pl. 01a",
    title: "The Wandering Keep",
    world: "Surreal",
    detail: "Dreams, drawn precisely",
    cover: "/home/sample/cover-surreal.webp",
  },
  {
    plate: "Pl. 01b",
    title: "The Silver Citadel",
    world: "Fantasy",
    detail: "Castles, quests, old maps",
    cover: "/home/cover-fantasy.webp",
  },
  {
    plate: "Pl. 01c",
    title: "The Far Station",
    world: "Sci-Fi",
    detail: "Stations, ships, far light",
    cover: "/home/sample/cover-scifi.webp",
  },
  {
    plate: "Pl. 01d",
    title: "Into the Deep Forest",
    world: "Wildlife",
    detail: "Forests, feathers and fur",
    cover: "/home/sample/cover-wildlife.webp",
  },
  {
    plate: "Pl. 01e",
    title: "A Quiet Night In",
    world: "Cozy",
    detail: "Slow rooms, warm evenings",
    cover: "/home/sample/cover-cozy.webp",
  },
];

export const COVER_SIZE = { width: 720, height: 932 } as const;

export const HOME_SHOP_COPY = {
  heading: "Pick a world.",
  lead: "The books, one world each. Start with the one that pulls you\u00a0in.",
  cta: { label: "Shop all books", href: HOME_ROUTES.books },
  sampleNote: "Cover art and titles · Sample",
} as const;

export const HOME_REST_COPY = {
  caption: "The Silver Citadel \u00a0·\u00a0 Plate 07",
  alt: "A single printed page from The Silver Citadel, in line, before coloring",
  line: "Nothing here moves.",
  second: "Everything rewards a second\u00a0look.",
} as const;

/** SAMPLE: the printed code format. Production shows an empty code box. */
export const SAMPLE_CODE_MASK = "•\u2009•\u2009•\u2009•";

export const HOME_CODES_COPY = {
  lines: ["Every page", "has a code."],
  plate: "Plate 07",
  book: "The Silver Citadel",
  note: "Printed at the foot of every page ↓",
} as const;

export const HOME_POINTS = [
  { value: "1", label: "1 point", text: "The code on its own" },
  {
    value: "2",
    label: "2 points",
    text: "The code, plus a scan of the page you colored",
  },
] as const;

export const HOME_ENTER_COPY = {
  heading: "Type it\u00a0in.",
  lead: "It\u2019s printed at the foot of the page, beside the plate number. Type it in to earn points toward more of the world, starting with stories where you choose the path.",
  label: "Page code",
  hint: "From the foot of any page",
  sampleHint: "From the foot of any page · sample format",
  placeholder: "• • • •",
  submit: "Enter",
  registerLabel: "Before you start",
  register:
    "Scan the QR on the back cover once. It registers the book to your account and opens its unlocks.",
  registerCta: { label: "Register your book", href: HOME_ROUTES.scan },
} as const;

export type HomeWorld = {
  plate: string;
  name: string;
  detail: string;
  art: string;
};

export const HOME_WORLDS: readonly HomeWorld[] = [
  {
    plate: "Pl. 05a",
    name: "Fantasy",
    detail: "Castles, quests, old maps",
    art: "/home/sample/world-fantasy.webp",
  },
  {
    plate: "Pl. 05b",
    name: "Surreal",
    detail: "Dreams, drawn precisely",
    art: "/home/sample/world-surreal.webp",
  },
  {
    plate: "Pl. 05c",
    name: "Sci-Fi",
    detail: "Stations, ships, far light",
    art: "/home/sample/world-scifi.webp",
  },
  {
    plate: "Pl. 05d",
    name: "Wildlife",
    detail: "Forests, feathers and fur",
    art: "/home/sample/world-wildlife.webp",
  },
  {
    plate: "Pl. 05e",
    name: "Cozy",
    detail: "Slow rooms, warm evenings",
    art: "/home/sample/world-cozy.webp",
  },
];

export const HOME_WORLDS_COPY = {
  heading: "Step inside a\u00a0world.",
  lead: "Each book is one world, with its own light, places and small surprises.",
  cta: { label: "See all worlds", href: HOME_ROUTES.worlds },
  sampleBg: {
    src: "/home/sample/world-surreal.webp",
    alt: "A door standing in still water under a pale moon",
    caption: "Surreal · Sample art",
  },
  bg: {
    alt: "The Silver Citadel plate, colored",
    caption: "Fantasy · The Silver Citadel",
  },
  sampleNote: "World plates · Sample art · AI",
} as const;

export const HOME_FOOTER_COPY = {
  lines: ["Take your", "time."],
  groups: [
    {
      heading: "Shop",
      links: [
        { name: "All books", href: HOME_ROUTES.books },
        { name: "Worlds", href: HOME_ROUTES.worlds },
        { name: "Collectibles", href: HOME_ROUTES.collectibles },
      ],
    },
    {
      heading: "Unlocks",
      links: [
        { name: "Scan a code", href: HOME_ROUTES.scan },
        { name: "Enter a code", href: HOME_ROUTES.enterCode },
        { name: "Stories", href: HOME_ROUTES.stories },
        { name: "Trophy Room", href: HOME_ROUTES.trophyRoom },
      ],
    },
    {
      heading: "Help",
      links: [
        { name: "FAQ", href: HOME_ROUTES.help },
        { name: "Contact", href: `${HOME_ROUTES.help}#contact` },
        { name: "Shipping", href: `${HOME_ROUTES.help}#orders` },
        { name: "About", href: HOME_ROUTES.about },
      ],
    },
    {
      heading: "Account",
      links: [
        { name: "Sign in", href: HOME_ROUTES.signIn },
        { name: "Create account", href: HOME_ROUTES.register },
        { name: "Order lookup", href: HOME_ROUTES.orders },
      ],
    },
  ],
  newsletter: {
    label: "New books by email",
    note: "A short note when a new world opens.",
    placeholder: "Your email",
    submit: "Sign up",
  },
  legal: [
    { name: "Privacy", href: HOME_ROUTES.privacy },
    { name: "Terms", href: HOME_ROUTES.terms },
    { name: "Licenses", href: HOME_ROUTES.licenses },
  ],
} as const;
