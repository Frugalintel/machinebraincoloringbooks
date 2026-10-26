import { normalizeBookCode } from "@/lib/scan-params";
import type { PlateCell, ScanViewState } from "@/lib/scan-ledger/types";
import type { TrophyTierName } from "@/lib/scan-tiers";

export const SCAN_OPT_LINE =
  "Photo of the colored page · optional · +1 more once verified";

export const PHOTO_OPTIONAL = "Optional · +1 more once verified";

export const SCAN_SPEND_NOTE =
  "Spending wallet points on stories never lowers a tier.";

export const SCAN_SAMPLE_NOTE = "Example · sample book, code and points";

export const SCAN_WALLET_LABEL = "Wallet · for stories";
export const SCAN_WALLET_FROM_POINTS = "Wallet · from your points";
export const SCAN_BOOK_TROPHY_LABEL = "This book · trophy";
export const SCAN_SIGN_IN_HREF = "/auth?mode=login&next=/scan";
export const SCAN_SIGN_IN_ACTION = "Sign in to count";

/** Carry a typed page code through /auth so /scan can prefill it after login. */
export function scanSignInHref(code?: string): string {
  const normalized = code ? normalizeBookCode(code) : "";
  if (!normalized) return SCAN_SIGN_IN_HREF;
  return `/auth?mode=login&next=${encodeURIComponent(`/scan?mode=code&code=${normalized}`)}`;
}

export const SCAN_EMPTY_CODE = "Type a code first.";

export const SCAN_SIGN_IN_CODE_HINT =
  "Sign in and this code counts toward your book.";
export const SCAN_SIGN_IN_BOOK_HINT =
  "Sign in to keep this book and its unlock.";

export const CELL_LABEL: Record<PlateCell, string> = {
  empty: "not added",
  code: "code, 1 pt",
  pending: "code 1 pt + photo pending verification",
  verified: "code + verified photo, 2 pts",
  now: "adding now",
  legendary: "Legendary page: code + verified photo, 2 pts",
};

/** Highlighted "now" cell on the locked mockup states. */
export const NOW_CELL_LABEL: Partial<Record<ScanViewState, string>> = {
  "code-only-before": "code counted, photo still open",
  collected: "collected already, code and page",
  "tier-reached": "photo just verified, 2 pts",
};

export function plateCellLabel(
  cell: PlateCell,
  options: { state?: ScanViewState; highlight?: boolean } = {},
): string {
  if (options.highlight && options.state) {
    const now = NOW_CELL_LABEL[options.state];
    if (now) return now;
  }
  return CELL_LABEL[cell];
}

export function sampleNote(state: ScanViewState): string {
  switch (state) {
    case "registered":
      return "Example · sample books, unlock and points";
    case "legendary-found":
      return "Example · a separate, earlier moment in the same book";
    case "signed-out-book":
    case "signed-out-code":
    case "camera-off":
    case "index":
    case "code":
    case "code-added":
    case "photo":
    case "photo-preview":
    case "pending":
    case "verified":
    case "tier-reached":
    case "code-only-before":
    case "collected":
    case "invalid":
      return SCAN_SAMPLE_NOTE;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function trophyPlateCaption(plate: string, code: string): string {
  return `PLATE ${plate} · ${code} · CODE + PHOTO`;
}

export function legendaryPlateCaption(plate: string): string {
  return `PLATE ${plate} · HIDDEN PAGE`;
}

const PLATE_FIXTURE_PREFIX = "Plate 07 · ";

/** Live captions never fall back to the Plate 07 fixture string. */
function captionWithoutFixturePlate(caption: string | null): string | null {
  if (!caption?.startsWith(PLATE_FIXTURE_PREFIX)) return caption;
  const rest = caption.slice(PLATE_FIXTURE_PREFIX.length);
  if (!rest) return null;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

export function plateScanCaption(
  state: ScanViewState,
  plate: string | null | undefined,
): string | null {
  const fallback = captionWithoutFixturePlate(CHROME[state].caption);
  if (!plate) return fallback;
  switch (state) {
    case "code-added":
      return `Plate ${plate} · code`;
    case "pending":
    case "verified":
    case "tier-reached":
      return `Plate ${plate} · code + photo`;
    case "legendary-found":
      return legendaryPlateCaption(plate);
    case "signed-out-book":
    case "signed-out-code":
    case "camera-off":
    case "index":
    case "registered":
    case "code":
    case "photo":
    case "photo-preview":
    case "code-only-before":
    case "collected":
    case "invalid":
      return fallback;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export const CAMERA_BLOCKED =
  "Settings › Safari › Camera › Allow, then reload.";
export const CAMERA_INSECURE =
  "The camera only opens over https. Page codes can always be typed.";

export type ScanChrome = {
  h1: string;
  running: string;
  lede: string | null;
  tag: string | null;
  stamp: string | null;
  caption: string | null;
  primary: string | null;
  secondary: string | null;
  showSpend: boolean;
};

const CHROME: Record<ScanViewState, ScanChrome> = {
  "signed-out-book": {
    h1: "Add a book.",
    running: "Back cover",
    lede: null,
    tag: null,
    stamp: null,
    caption: "Back cover in view",
    primary: null,
    secondary: "Type a page code",
    showSpend: false,
  },
  "signed-out-code": {
    h1: "Page code.",
    running: "Page code",
    lede: "+1 the moment the code is in.",
    tag: null,
    stamp: null,
    caption: null,
    primary: "Add +1",
    secondary: "Scan a back cover",
    showSpend: false,
  },
  "camera-off": {
    h1: "Camera off.",
    running: "Camera off",
    lede: null,
    tag: null,
    stamp: null,
    caption: "Camera off",
    primary: "Turn on camera",
    secondary: "Type a page code",
    showSpend: false,
  },
  index: {
    h1: "Add a book.",
    running: "Back cover",
    lede: null,
    tag: null,
    stamp: null,
    caption: "Back cover in view",
    primary: null,
    secondary: "Type a page code",
    showSpend: false,
  },
  registered: {
    h1: "Book added.",
    running: "Book added",
    lede: "The Silver Citadel is in your books. Its 40 plates are open for points.",
    tag: null,
    stamp: null,
    caption: "Your unlock · drawn at random for this copy",
    primary: "See it in your Trophy Room",
    secondary: "Add a page code",
    showSpend: false,
  },
  code: {
    h1: "Page code.",
    running: "Page code",
    lede: "+1 the moment the code is in.",
    tag: null,
    stamp: null,
    caption: null,
    primary: "Add +1",
    secondary: "Scan a back cover",
    showSpend: false,
  },
  "code-added": {
    h1: "Counted.",
    running: "+1 counted",
    lede: "Plate 07 counted. A photo of the colored page adds +1 more once it is verified.",
    tag: "+1",
    stamp: "+1 pt",
    caption: "Plate 07 · code",
    primary: "Add a photo · +1 more",
    secondary: "Not now, next code",
    showSpend: false,
  },
  photo: {
    h1: "Whole page.",
    running: "Page photo · optional",
    lede: "Fit the whole colored page in the frame.",
    tag: null,
    stamp: null,
    caption: "Camera",
    primary: null,
    secondary: "Upload from your photos",
    showSpend: false,
  },
  "photo-preview": {
    h1: "Check it.",
    running: "Check your photo",
    lede: "Sharp, flat, the whole page in view. Then send it.",
    tag: null,
    stamp: null,
    caption: "Your photo · sample",
    primary: "Send it",
    secondary: "Retake",
    showSpend: false,
  },
  pending: {
    h1: "Sent.",
    running: "Pending verification",
    lede: "The code is already counted. This +1 is added once the photo is verified.",
    tag: "+1 pending",
    stamp: "Pending verification",
    caption: "Plate 07 · code + photo",
    primary: "Enter another code",
    secondary: "Go to Trophy Room",
    showSpend: false,
  },
  verified: {
    h1: "Verified.",
    running: "Verified",
    lede: "+1 more, verified. Plate 07 is complete at 2 pts. Spending wallet points on stories never lowers a tier.",
    tag: "+1 more",
    stamp: "Verified · 2 pts",
    caption: "Plate 07 · code + photo",
    primary: "Enter another code",
    secondary: "Spend on stories",
    showSpend: true,
  },
  "tier-reached": {
    h1: "Pro.",
    running: "Trophy · Pro",
    lede: "The photo for plate 19 is verified. The Silver Citadel has 45 book pts, so its trophy moves up to Pro. Spending wallet points on stories never lowers a tier.",
    tag: "+1 more",
    stamp: "Verified · Pro unlocked",
    caption: "Plate 19 · code + photo",
    primary: "See the trophy",
    secondary: "Enter another code",
    showSpend: true,
  },
  "legendary-found": {
    h1: "Legendary.",
    running: "Legendary found",
    lede: "Plate 31 is the hidden page in this copy. Its code and photo are in, so the trophy for The Silver Citadel is Legendary. That includes Basic, Pro and Rare.",
    tag: "+1 more",
    stamp: "Legendary · found at 23 pts",
    caption: "Plate 31 · hidden page",
    primary: "See the trophy",
    secondary: "Enter another code",
    showSpend: false,
  },
  "code-only-before": {
    h1: "Code's in.",
    running: "Code in · photo open",
    lede: null,
    tag: null,
    stamp: null,
    caption: null,
    primary: "Add a photo · +1 more",
    secondary: "Enter another code",
    showSpend: false,
  },
  collected: {
    h1: "Collected.",
    running: "Collected",
    lede: null,
    tag: null,
    stamp: null,
    caption: null,
    primary: "Enter another code",
    secondary: null,
    showSpend: false,
  },
  invalid: {
    h1: "Not found.",
    running: "Not found",
    lede: null,
    tag: null,
    stamp: null,
    caption: null,
    primary: "Try again",
    secondary: "Scan a back cover",
    showSpend: false,
  },
};

/** Fitted sizes from the locked C-ledger mockups (`--fd` / `--fm`). */
export const SCAN_H1_FIT: Record<ScanViewState, { fd: string; fm: string }> = {
  "signed-out-book": { fd: "9.65vw", fm: "15vw" },
  "signed-out-code": { fd: "11.05vw", fm: "15vw" },
  "camera-off": { fd: "9.93vw", fm: "15vw" },
  index: { fd: "9.65vw", fm: "15vw" },
  registered: { fd: "9.31vw", fm: "15vw" },
  code: { fd: "11.05vw", fm: "15vw" },
  "code-added": { fd: "12.59vw", fm: "15vw" },
  photo: { fd: "9.31vw", fm: "15vw" },
  "photo-preview": { fd: "13.09vw", fm: "15vw" },
  pending: { fd: "21.88vw", fm: "15vw" },
  verified: { fd: "13.60vw", fm: "15vw" },
  "tier-reached": { fd: "23.61vw", fm: "15vw" },
  "legendary-found": { fd: "10.19vw", fm: "15vw" },
  "code-only-before": { fd: "12.21vw", fm: "15vw" },
  collected: { fd: "11.80vw", fm: "15vw" },
  invalid: { fd: "10.61vw", fm: "15vw" },
};

/** Longer tier words than "Pro." need a smaller desktop fit. */
const TIER_H1_FIT: Record<TrophyTierName, { fd: string; fm: string }> = {
  Basic: { fd: "14.72vw", fm: "13.8vw" },
  Pro: SCAN_H1_FIT["tier-reached"],
  Rare: { fd: "17.85vw", fm: "15vw" },
  Legendary: SCAN_H1_FIT["legendary-found"],
};

export type ScanChromeOptions = {
  trophyTier?: TrophyTierName | null;
  /** Preview fixtures only. Live omits this so Pro copy stays at 45. */
  bookPoints?: number | null;
};

export function scanH1Fit(
  state: ScanViewState,
  trophyTier?: TrophyTierName | null,
): { fd: string; fm: string } {
  if (state === "tier-reached" && trophyTier) {
    return TIER_H1_FIT[trophyTier];
  }
  return SCAN_H1_FIT[state];
}

export function scanChrome(
  state: ScanViewState,
  options: ScanChromeOptions = {},
): ScanChrome {
  const base = CHROME[state];
  if (state !== "tier-reached") return base;
  const tier = options.trophyTier ?? "Pro";
  switch (tier) {
    case "Basic":
    case "Pro":
    case "Rare":
    case "Legendary":
      return {
        ...base,
        h1: `${tier}.`,
        running: `Trophy · ${tier}`,
        stamp: `Verified · ${tier} unlocked`,
        lede: `The photo for plate 19 is verified. The Silver Citadel has ${options.bookPoints ?? 45} book pts, so its trophy moves up to ${tier}. Spending wallet points on stories never lowers a tier.`,
      };
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export function invalidCodeMessage(code: string): string {
  return `${code} isn't in any Machine Brain book. Check the letters by the page number.`;
}

export function signedOutScanHint(state: ScanViewState): string | null {
  switch (state) {
    case "code":
    case "signed-out-code":
    case "invalid":
      return SCAN_SIGN_IN_CODE_HINT;
    case "signed-out-book":
    case "index":
    case "camera-off":
      return SCAN_SIGN_IN_BOOK_HINT;
    case "registered":
    case "code-added":
    case "photo":
    case "photo-preview":
    case "pending":
    case "verified":
    case "tier-reached":
    case "legendary-found":
    case "code-only-before":
    case "collected":
      return null;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function photoPreviewTag(sample: boolean): string {
  return sample ? "Your photo · sample" : "Your photo";
}

export function collectedMessage(plate: string): string {
  return `Plate ${plate} is in, code and page.`;
}

export function codeInMessage(plate: string): string {
  return `The code for plate ${plate} is in. The photo is still open.`;
}

export function signedOutCodeMessage(): string {
  return "That code looks valid. Sign in or register the book to count it.";
}

export function systemErrorMessage(): string {
  return "Something went wrong. Try again.";
}
