/**
 * /help · A · Index. Copy is locked to the mockup plus home.ts reuse.
 * Voice: "you", never "we". No exclamation marks. Placeholders stay marked.
 */

import { HOME_CODES_COPY, HOME_ENTER_COPY, HOME_ROUTES } from "@/lib/home";

export const HELP_SIGN_IN_HREF = "/auth?mode=login&next=/help" as const;
export const HELP_REGISTER_HREF = "/auth?mode=register" as const;

export const HELP_SAMPLE_CODE = "SC07-K4M9" as const;

export const HELP_ART = {
  pageLine: {
    src: "/help/page-line.webp",
    width: 1200,
    height: 1553,
    alt: "Sample printed page, art on the left and paper on the right, cropped to the foot",
  },
  pageColor: {
    src: "/help/page-half.webp",
    width: 1200,
    height: 1553,
    alt: "Sample colored page, shown whole and flat",
  },
  trophy: {
    src: "/help/trophy-basic.webp",
    width: 900,
    height: 1100,
    alt: "Sample Basic trophy for one book",
  },
} as const;

export const HELP_EYE = {
  plate: "PL. 00",
  label: "Help",
} as const;

export const HELP_H1 = "Help." as const;

export const HELP_LEDE =
  "Your books, codes, points and account, in one place. Take what you need.";

export const HELP_HOW_EYE = "How it works" as const;

/** Reused from home: "Every page" / "has a code." */
export const HELP_HOW_LINES = HOME_CODES_COPY.lines;

export const HELP_SAMPLE_NOTE = "QR, code and art shown are samples" as const;

export const HELP_CONTACT_EYE = {
  n: "09",
  label: "Contact",
} as const;

export const HELP_CONTACT_H = "Write in." as const;

export const HELP_CONTACT_LEAD =
  "If your question isn\u2019t here, write to a person. Include the book title and the plate number if it is about a page.";

export type HelpTopicId =
  | "books"
  | "codes"
  | "photos"
  | "points"
  | "collect"
  | "stories"
  | "account"
  | "orders";

export type HelpChipId = "all" | HelpTopicId;

export type HelpContentsId = HelpTopicId | "contact";

export type HelpStepArt = "qr" | "code" | "photo" | "trophy";

export type HelpInline =
  | { type: "text"; text: string }
  | { type: "link"; href: string; label: string }
  | { type: "placeholder"; text: string };

export type HelpQuestion = {
  id: string;
  question: string;
  open?: boolean;
  answer: readonly (readonly HelpInline[])[];
};

export type HelpGroup = {
  id: HelpTopicId;
  n: string;
  chip: string;
  kicker: string;
  heading: string;
  questions: readonly HelpQuestion[];
};

export type HelpStep = {
  n: string;
  label: string;
  title: string;
  body: string;
  art: HelpStepArt;
};

export const HELP_CONTENTS: readonly {
  n: string;
  id: HelpContentsId;
  label: string;
}[] = [
  { n: "01", id: "books", label: "Your book" },
  { n: "02", id: "codes", label: "Page codes" },
  { n: "03", id: "photos", label: "Scanning and photos" },
  { n: "04", id: "points", label: "Points and tiers" },
  { n: "05", id: "collect", label: "Collectibles" },
  { n: "06", id: "stories", label: "Stories" },
  { n: "07", id: "account", label: "Account and sign in" },
  { n: "08", id: "orders", label: "Orders and shipping" },
  { n: "09", id: "contact", label: "Contact" },
];

export const HELP_CHIPS: readonly { id: HelpChipId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "books", label: "Books" },
  { id: "codes", label: "Codes" },
  { id: "photos", label: "Photos" },
  { id: "points", label: "Points" },
  { id: "collect", label: "Collectibles" },
  { id: "stories", label: "Stories" },
  { id: "account", label: "Account" },
  { id: "orders", label: "Orders" },
];

/** Register copy from home, then the collectible that opens with the book. */
export const HELP_REGISTER_BODY = HOME_ENTER_COPY.register.replace(
  /\.$/,
  ", starting with a collectible drawn at random for your copy.",
);

export const HELP_STEPS: readonly HelpStep[] = [
  {
    n: "01",
    label: "Once per book",
    title: "Register the book",
    body: HELP_REGISTER_BODY,
    art: "qr",
  },
  {
    n: "02",
    label: "+1 point",
    title: "Enter the page code",
    body: "Every page has a code, printed at the foot beside the plate number, the way a page number would be. Enter it and the page counts one point.",
    art: "code",
  },
  {
    n: "03",
    label: "+1 more, once verified",
    title: "Add a photo",
    body: "Optional. Photograph the colored page, whole and flat. Once the photo is verified the page counts one more. Two points a page at most.",
    art: "photo",
  },
  {
    n: "04",
    label: "Trophy and wallet",
    title: "Points add up",
    body: "Each point counts toward this book\u2019s trophy, from Basic to Pro to Rare, and goes into your wallet for stories. Spending never lowers a tier.",
    art: "trophy",
  },
];

export const HELP_PLACEHOLDERS = [
  "Placeholder · typed fallback for the book QR · to confirm",
  "Placeholder · lost or illegible code policy · Jayden to set",
  "Placeholder · how long a check takes",
  "Placeholder · points per tier · Jayden to set",
  "Placeholder · points per story · Jayden to set",
  "Placeholder · password reset · not built yet",
  "Placeholder · regions, times and returns · Jayden to supply",
  "Placeholder · Support email · to confirm",
] as const;

export const HELP_CONTACT_PLACEHOLDER = {
  label: HELP_PLACEHOLDERS[7],
  body: "The address you can write to, and roughly when to expect a reply. Nothing is stated here until it is confirmed.",
} as const;

function text(value: string): HelpInline {
  return { type: "text", text: value };
}

function link(href: string, label: string): HelpInline {
  return { type: "link", href, label };
}

function placeholder(value: (typeof HELP_PLACEHOLDERS)[number]): HelpInline {
  return { type: "placeholder", text: value };
}

export const HELP_FAQ: readonly HelpGroup[] = [
  {
    id: "books",
    n: "01",
    chip: "Books",
    kicker: "Books",
    heading: "Your book",
    questions: [
      {
        id: "register",
        question: "How do I register a book?",
        answer: [
          [text(`${HOME_ENTER_COPY.register} You only do this once per book.`)],
        ],
      },
      {
        id: "several",
        question: "I have more than one book.",
        answer: [
          [
            text(
              "Register each one. Every book keeps its own pages, points and trophy.",
            ),
          ],
        ],
      },
      {
        id: "qr-wont",
        question: "The back-cover QR won\u2019t scan.",
        answer: [
          [
            text(
              "Try more light and hold the camera a little further away, so the whole square is in frame. ",
            ),
            placeholder(HELP_PLACEHOLDERS[0]),
          ],
        ],
      },
    ],
  },
  {
    id: "codes",
    n: "02",
    chip: "Codes",
    kicker: "Codes",
    heading: "Page codes",
    questions: [
      {
        id: "where",
        question: "Where is the page code?",
        open: true,
        answer: [
          [
            text(
              "At the foot of every page, printed beside the plate number, the way a page number would be.",
            ),
          ],
        ],
      },
      {
        id: "enter",
        question: "How do I enter a code?",
        answer: [
          [
            text("Open Scan and choose "),
            link(HOME_ROUTES.enterCode, "Enter a code"),
            text(
              ", then type it in. Capitals don\u2019t matter. A code adds one point to its book.",
            ),
          ],
        ],
      },
      {
        id: "twice",
        question: "Can a page count twice?",
        answer: [
          [
            text(
              "Each page counts once for its code, and once more for a verified photo. Entering the same code again adds nothing.",
            ),
          ],
        ],
      },
      {
        id: "invalid",
        question: "It says the code isn\u2019t valid.",
        answer: [
          [
            text(
              "Check it against the letters at the foot of the page and try again. Make sure the book it belongs to is registered to your account.",
            ),
          ],
        ],
      },
      {
        id: "lost",
        question: "A code is missing or hard to read.",
        answer: [
          [
            placeholder(HELP_PLACEHOLDERS[1]),
            text(
              " Until then, write in with the book title and the plate number.",
            ),
          ],
        ],
      },
    ],
  },
  {
    id: "photos",
    n: "03",
    chip: "Photos",
    kicker: "Photos",
    heading: "Scanning and photos",
    questions: [
      {
        id: "optional",
        question: "Do I have to photograph my pages?",
        answer: [
          [
            text(
              "No. A photo is optional. The code alone counts one point; a verified photo of the colored page adds one more.",
            ),
          ],
        ],
      },
      {
        id: "good",
        question: "What makes a photo verify?",
        answer: [
          [
            text(
              "The whole page in frame, flat, in good light. Color it as you like; nothing about the coloring is judged.",
            ),
          ],
        ],
      },
      {
        id: "pending",
        question: "What does “pending” mean?",
        answer: [
          [
            text(
              "Your photo is waiting for a check. The code\u2019s point is already counted; the second arrives once the photo is verified. ",
            ),
            placeholder(HELP_PLACEHOLDERS[2]),
          ],
        ],
      },
      {
        id: "camera",
        question: "The camera won\u2019t open.",
        answer: [
          [
            text(
              "Allow camera access for this site in your browser settings, then reload. You can always type the code instead.",
            ),
          ],
        ],
      },
    ],
  },
  {
    id: "points",
    n: "04",
    chip: "Points",
    kicker: "Points",
    heading: "Points and tiers",
    questions: [
      {
        id: "what",
        question: "What are points for?",
        answer: [
          [
            text(
              "Every point counts twice: toward this book\u2019s trophy, and into your wallet for stories. Spending wallet points on a story never lowers a tier.",
            ),
          ],
        ],
      },
      {
        id: "tiers",
        question: "How do trophy tiers work?",
        answer: [
          [
            text(
              "Each book has its own trophy. It moves from Basic to Pro to Rare as the book\u2019s points add up. ",
            ),
            placeholder(HELP_PLACEHOLDERS[3]),
          ],
        ],
      },
      {
        id: "legendary",
        question: "What is the Legendary hidden page?",
        answer: [
          [
            text(
              "One page in your copy is hidden, and it is a different page for each reader. Find it and the trophy becomes Legendary. Its tag keeps the book\u2019s points at the time you found it; lower is rarer.",
            ),
          ],
        ],
      },
    ],
  },
  {
    id: "collect",
    n: "05",
    chip: "Collectibles",
    kicker: "Collectibles",
    heading: "Collectibles",
    questions: [
      {
        id: "collectible",
        question: "What is a collectible?",
        answer: [
          [
            text(
              "Registering a book opens a digital collectible drawn at random for your copy. You will find it in the ",
            ),
            link(HOME_ROUTES.trophyRoom, "Trophy Room"),
            text(", with its rarity marked."),
          ],
        ],
      },
      {
        id: "choose",
        question: "Can I choose which one I get?",
        answer: [
          [
            text(
              "No. It is drawn for your copy when you register the book. That is part of the surprise.",
            ),
          ],
        ],
      },
    ],
  },
  {
    id: "stories",
    n: "06",
    chip: "Stories",
    kicker: "Stories",
    heading: "Stories",
    questions: [
      {
        id: "stories-what",
        question: "What are stories?",
        answer: [
          [
            text(
              "Stories set in the worlds of the books, where you choose the path. You open them with points from your wallet.",
            ),
          ],
        ],
      },
      {
        id: "cost",
        question: "How many points does a story take?",
        answer: [[placeholder(HELP_PLACEHOLDERS[4])]],
      },
    ],
  },
  {
    id: "account",
    n: "07",
    chip: "Account",
    kicker: "Account",
    heading: "Account and sign in",
    questions: [
      {
        id: "need",
        question: "Do I need an account?",
        answer: [
          [
            text(
              "Yes. Your account keeps your books, points and unlocks together. ",
            ),
            link(HELP_REGISTER_HREF, "Create one"),
            text(" with your email and a password."),
          ],
        ],
      },
      {
        id: "signin",
        question: "How do I sign in?",
        answer: [
          [
            link(HELP_SIGN_IN_HREF, "Sign in"),
            text(
              " with the email and password you used to create your account.",
            ),
          ],
        ],
      },
      {
        id: "forgot",
        question: "I forgot my password.",
        answer: [[placeholder(HELP_PLACEHOLDERS[5])]],
      },
    ],
  },
  {
    id: "orders",
    n: "08",
    chip: "Orders",
    kicker: "Orders",
    heading: "Orders and shipping",
    questions: [
      {
        id: "where-order",
        question: "Where is my order?",
        answer: [
          [
            text("Look it up on "),
            link("/orders/lookup", "Order lookup"),
            text(" with your order number."),
          ],
        ],
      },
      {
        id: "ship",
        question: "Shipping and returns",
        answer: [[placeholder(HELP_PLACEHOLDERS[6])]],
      },
    ],
  },
];

export function isHelpChipId(value: string): value is HelpChipId {
  return HELP_CHIPS.some((chip) => chip.id === value);
}

export function isHelpTopicId(value: string): value is HelpTopicId {
  return HELP_FAQ.some((group) => group.id === value);
}
