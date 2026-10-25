import type { PlateCell, ScanViewState } from "@/lib/scan-ledger/types";

export const SCAN_OPT_LINE =
  "Photo of the colored page · optional · +1 more once verified";

export const PHOTO_OPTIONAL = "Optional · +1 more once verified";

export const SCAN_SPEND_NOTE =
  "Spending wallet points on stories never lowers a tier.";

export const SCAN_SAMPLE_NOTE = "Example · sample book, code and points";

export const SCAN_WALLET_LABEL = "Wallet · for stories";
export const SCAN_WALLET_FROM_POINTS = "Wallet · from your points";
export const SCAN_BOOK_TROPHY_LABEL = "This book · trophy";

export const CELL_LABEL: Record<PlateCell, string> = {
  empty: "not added",
  code: "code, 1 pt",
  pending: "code 1 pt + photo pending verification",
  verified: "code + verified photo, 2 pts",
  now: "adding now",
  legendary: "Legendary page: code + verified photo, 2 pts",
};

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
    caption: "Camera · sample view",
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

export function scanChrome(state: ScanViewState): ScanChrome {
  return CHROME[state];
}

export function invalidCodeMessage(code: string): string {
  return `${code} isn't in any of our books. Check the letters by the page number.`;
}

export function collectedMessage(plate: string): string {
  return `Plate ${plate} is in, code and page.`;
}

export function codeInMessage(plate: string): string {
  return `The code for plate ${plate} is in. The photo is still open.`;
}

export function systemErrorMessage(): string {
  return "Something went wrong. Try again.";
}
