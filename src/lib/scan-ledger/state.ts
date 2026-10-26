import { normalizeBookCode } from "@/lib/scan-params";
import { nextTierCopy, tierOf, type TrophyTierName } from "@/lib/scan-tiers";
import type {
  BookRow,
  PlateCell,
  ScanLedgerSnapshot,
} from "@/lib/scan-ledger/types";

export { normalizeBookCode };

const CODE_SHAPE = /^[A-Z0-9][A-Z0-9-]{1,19}$/;

export function isPlausiblePageCode(code: string): boolean {
  return CODE_SHAPE.test(code);
}

export function plateIndex(
  value: string | number | null | undefined,
): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export function plateLabel(n: number): string {
  return String(n).padStart(2, "0");
}

export function folioLine(plate: string | number, code: string): string {
  return `PL. ${typeof plate === "number" ? plateLabel(plate) : plate} · ${code}`;
}

export function emptyPlates(count: number): PlateCell[] {
  return Array.from({ length: count }, () => "empty");
}

export function cellPoints(cell: PlateCell): number {
  switch (cell) {
    case "verified":
    case "legendary":
      return 2;
    case "code":
    case "pending":
      return 1;
    case "now":
    case "empty":
      return 0;
    default: {
      const _exhaustive: never = cell;
      return _exhaustive;
    }
  }
}

export function bookPointsFromPlates(plates: readonly PlateCell[]): number {
  return plates.reduce((sum, cell) => sum + cellPoints(cell), 0);
}

export function allCodesEntered(plates: readonly PlateCell[]): boolean {
  return plates.every((cell) => cell !== "empty" && cell !== "now");
}

export function pendingPhotoCount(plates: readonly PlateCell[]): number {
  return plates.filter((cell) => cell === "pending").length;
}

export function deriveBookRow(input: {
  id: string;
  title: string;
  plates: PlateCell[];
  currentPlate?: number | null;
  hitPlate?: number | null;
  legendaryPlate?: number | null;
  legendaryFoundAt?: number | null;
  isNew?: boolean;
}): BookRow {
  const legendary = input.legendaryFoundAt != null;
  const bookPoints = bookPointsFromPlates(input.plates);
  const allCodesIn = allCodesEntered(input.plates);
  const pendingCount = pendingPhotoCount(input.plates);
  const tier: TrophyTierName | "No tier yet" = tierOf(
    bookPoints,
    input.plates.length,
    legendary,
  );
  return {
    id: input.id,
    title: input.title,
    plateCount: input.plates.length,
    bookPoints,
    plates: input.plates,
    currentPlate: input.currentPlate ?? null,
    hitPlate: input.hitPlate ?? null,
    legendaryPlate: input.legendaryPlate ?? null,
    legendaryFoundAt: input.legendaryFoundAt ?? null,
    isNew: input.isNew,
    allCodesIn,
    pendingCount,
    tier,
    next: nextTierCopy(bookPoints, input.plates.length, {
      allCodesIn,
      pending: pendingCount,
      legendary,
    }),
  };
}

export type ExistingPageRecord = {
  hasCode: boolean;
  scanStatus: "pending" | "approved" | "rejected" | null;
};

/** Derive the prompt after a typed page code, without inventing points. */
export function deriveCodeOutcome(
  existing: ExistingPageRecord | null,
): "invalid" | "code-added" | "code-only-before" | "pending" | "collected" {
  if (!existing) return "invalid";
  if (!existing.hasCode) return "code-added";
  if (existing.scanStatus === "approved") return "collected";
  if (existing.scanStatus === "pending") return "pending";
  return "code-only-before";
}

export type ProfileLedgerProgress = {
  plateCount: number;
  pendingCount: number;
  bookCount: number;
};

/** Same plate / pending counts the /scan ledger already derives. */
export function profileProgressFromLedger(
  snapshot: ScanLedgerSnapshot | null | undefined,
): ProfileLedgerProgress {
  if (!snapshot) {
    return { plateCount: 0, pendingCount: 0, bookCount: 0 };
  }
  let plateCount = 0;
  let pendingCount = 0;
  for (const book of snapshot.books) {
    pendingCount += book.pendingCount;
    for (const cell of book.plates) {
      if (cell !== "empty" && cell !== "now") plateCount += 1;
    }
  }
  return {
    plateCount,
    pendingCount,
    bookCount: snapshot.books.length,
  };
}

export function storyBarWidth(wallet: number | null, cost: number): number {
  if (wallet == null || cost <= 0) return 0;
  return Math.min(100, Math.round((wallet / cost) * 100));
}
