import type { TrophyTierName } from "@/lib/scan-tiers";

export type PlateCell =
  | "empty"
  | "code"
  | "pending"
  | "verified"
  | "now"
  | "legendary";

export type ScanViewState =
  | "signed-out-book"
  | "signed-out-code"
  | "camera-off"
  | "index"
  | "registered"
  | "code"
  | "code-added"
  | "photo"
  | "photo-preview"
  | "pending"
  | "verified"
  | "tier-reached"
  | "legendary-found"
  | "code-only-before"
  | "collected"
  | "invalid";

export type AuthHoldKind = "book" | "page-plus" | "code";

export type AuthHold = {
  kind: AuthHoldKind;
  label: string;
};

export type WalletSnapshot = {
  /** False when no points or XP field exists on the profile. */
  available: boolean;
  points: number | null;
  /** Honest source. XP is only shown when a real field is present. */
  source: "points" | "xp" | "fixture" | "unavailable";
};

export type StoryTarget = {
  title: string;
  costPts: number;
};

export type BookRow = {
  id: string;
  title: string;
  plateCount: number;
  bookPoints: number;
  plates: PlateCell[];
  currentPlate: number | null;
  hitPlate: number | null;
  legendaryPlate: number | null;
  legendaryFoundAt: number | null;
  isNew?: boolean;
  allCodesIn: boolean;
  pendingCount: number;
  tier: TrophyTierName | "No tier yet";
  next: string;
};

export type ActivePlate = {
  plate: string;
  code: string;
  title: string;
  bookTitle: string;
};

export type UnlockPreview = {
  name: string;
  rarity: string;
  set: string;
  note: string;
  image: string;
};

export type ScanLedgerSnapshot = {
  signedIn: boolean;
  sample: boolean;
  wallet: WalletSnapshot;
  story: StoryTarget | null;
  books: BookRow[];
  showNextBookSlot: boolean;
  activePlate: ActivePlate | null;
  unlock: UnlockPreview | null;
  /** Preview-only trophy override so Basic/Rare can be reviewed beside Pro. */
  trophyTier?: TrophyTierName | null;
};

export type RegisterBookResult =
  | { ok: false; kind: "signed-out"; hold: AuthHold }
  | {
      ok: false;
      kind: "stub";
      message: string;
    }
  | { ok: true; kind: "registered"; snapshot: ScanLedgerSnapshot };

export type SubmitCodeResult =
  | { ok: false; kind: "signed-out"; hold: AuthHold }
  | { ok: false; kind: "invalid"; code: string; message: string }
  | { ok: false; kind: "error"; message: string }
  | {
      ok: true;
      kind: "code-added" | "code-only-before" | "pending" | "collected";
      code: string;
      plate: ActivePlate;
      snapshot: ScanLedgerSnapshot;
    };

export type SubmitPhotoResult =
  | { ok: false; kind: "signed-out"; hold: AuthHold }
  | { ok: false; kind: "stub"; message: string }
  | { ok: false; kind: "error"; message: string }
  | {
      ok: true;
      kind: "pending";
      snapshot: ScanLedgerSnapshot;
    };

export type ScanLedgerAdapter = {
  getLedger(userId: string | null): Promise<ScanLedgerSnapshot>;
  registerBook(input: {
    userId: string | null;
    code: string;
  }): Promise<RegisterBookResult>;
  submitPageCode(input: {
    userId: string | null;
    code: string;
  }): Promise<SubmitCodeResult>;
  submitPagePhoto(input: {
    userId: string | null;
    code: string;
    image: Blob;
  }): Promise<SubmitPhotoResult>;
};

export const SCAN_STUB = {
  register:
    "Book registration is not on this build yet. The code was not saved.",
  hiddenPage: "Hidden-page assignment is not on this build yet.",
  walletSpend: "Wallet spend is not on this build yet.",
  photoWithoutBackend: "This preview cannot send a photo to a live queue.",
} as const;
