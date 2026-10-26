import { nextTierCopy, type TrophyTierName } from "@/lib/scan-tiers";
import {
  SCAN_STUB,
  type ActivePlate,
  type BookRow,
  type PlateCell,
  type ScanLedgerAdapter,
  type ScanLedgerSnapshot,
  type ScanViewState,
  type WalletSnapshot,
} from "@/lib/scan-ledger/types";
import {
  deriveBookRow,
  emptyPlates,
  plateLabel,
} from "@/lib/scan-ledger/state";

export const SAMPLE_SILVER = {
  id: "silver-citadel",
  title: "The Silver Citadel",
  plates: 40,
} as const;

export const SAMPLE_FAR = {
  id: "far-station",
  title: "The Far Station",
  plates: 24,
} as const;

export const SAMPLE_PAGE: ActivePlate = {
  plate: "07",
  code: "7KQ2",
  title: "The glasshouse car",
  bookTitle: SAMPLE_SILVER.title,
};

export const SAMPLE_BAD_CODE = "7KQ3";

export const SAMPLE_STORY = {
  title: "The Lantern Road",
  costPts: 30,
} as const;

export const SAMPLE_UNLOCK = {
  name: "Atomic-Poodle",
  rarity: "Rare",
  set: "Vacuum Pups",
  note: "Drawn at random for this copy",
  image: "/scan/sample/atomic-poodle.webp",
} as const;

const FAR_CELLS: Readonly<Record<number, PlateCell>> = {
  1: "verified",
  2: "verified",
  3: "code",
  4: "verified",
  5: "code",
  6: "verified",
  9: "code",
  10: "code",
};

function farPlates(): PlateCell[] {
  return Array.from(
    { length: SAMPLE_FAR.plates },
    (_, i) => FAR_CELLS[i + 1] ?? "empty",
  );
}

function farRow(): BookRow {
  return deriveBookRow({
    id: SAMPLE_FAR.id,
    title: SAMPLE_FAR.title,
    plates: farPlates(),
  });
}

/** Almost every code in: 01 and 04 verified, the rest codes, with one override. */
function silverAlmost(override: {
  plate: number;
  cell: PlateCell;
  extraVerified?: number[];
}): PlateCell[] {
  const extra = new Set(override.extraVerified ?? [1, 4]);
  return Array.from({ length: SAMPLE_SILVER.plates }, (_, i) => {
    const n = i + 1;
    if (n === override.plate) return override.cell;
    if (extra.has(n)) return "verified";
    return "code";
  });
}

function silverLegendary(): PlateCell[] {
  const verified = new Set([1, 4, 7, 12]);
  return Array.from({ length: SAMPLE_SILVER.plates }, (_, i) => {
    const n = i + 1;
    if (n === 31) return "legendary";
    if (verified.has(n)) return "verified";
    if (n <= 17) return "code";
    return "empty";
  });
}

function silverRow(
  plates: PlateCell[],
  extra: Partial<
    Pick<
      BookRow,
      | "currentPlate"
      | "hitPlate"
      | "legendaryPlate"
      | "legendaryFoundAt"
      | "isNew"
    >
  > = {},
): BookRow {
  return deriveBookRow({
    id: SAMPLE_SILVER.id,
    title: SAMPLE_SILVER.title,
    plates,
    ...extra,
  });
}

function wallet(points: number): WalletSnapshot {
  return { available: true, points, source: "fixture" };
}

function signedOutSnapshot(): ScanLedgerSnapshot {
  return {
    signedIn: false,
    sample: true,
    wallet: wallet(0),
    story: SAMPLE_STORY,
    books: [],
    showNextBookSlot: true,
    activePlate: SAMPLE_PAGE,
    unlock: null,
  };
}

function withFar(
  walletPts: number,
  extra: BookRow[] = [],
  signedIn = true,
): ScanLedgerSnapshot {
  return {
    signedIn,
    sample: true,
    wallet: wallet(walletPts),
    story: SAMPLE_STORY,
    books: [...extra, farRow()],
    showNextBookSlot: extra.length === 0,
    activePlate: SAMPLE_PAGE,
    unlock: null,
  };
}

function silverForTrophyTier(tier: TrophyTierName): PlateCell[] {
  switch (tier) {
    case "Basic":
      return silverAlmost({ plate: 19, cell: "verified", extraVerified: [19] });
    case "Rare":
      return silverAlmost({
        plate: 19,
        cell: "verified",
        extraVerified: [
          1, 4, 7, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ],
      });
    case "Pro":
      return silverAlmost({
        plate: 19,
        cell: "verified",
        extraVerified: [1, 4, 7, 12, 19],
      });
    case "Legendary":
      return silverLegendary();
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export function fixtureSnapshot(
  state: ScanViewState,
  options: { trophyTier?: TrophyTierName } = {},
): ScanLedgerSnapshot {
  switch (state) {
    case "signed-out-book":
    case "signed-out-code":
      return signedOutSnapshot();
    case "camera-off":
    case "index":
      return withFar(12);
    case "registered":
      return {
        ...withFar(12, [
          silverRow(emptyPlates(SAMPLE_SILVER.plates), { isNew: true }),
        ]),
        unlock: SAMPLE_UNLOCK,
        showNextBookSlot: false,
      };
    case "code":
      return withFar(12, [
        silverRow(silverAlmost({ plate: 7, cell: "now" }), { currentPlate: 7 }),
      ]);
    case "invalid":
      return withFar(12, [
        silverRow(silverAlmost({ plate: 7, cell: "empty" })),
      ]);
    case "code-added":
    case "photo":
    case "photo-preview":
    case "code-only-before":
      return withFar(13, [
        silverRow(silverAlmost({ plate: 7, cell: "code" }), {
          currentPlate: state === "code-only-before" ? 7 : null,
          hitPlate: state === "code-only-before" ? 7 : null,
        }),
      ]);
    case "pending":
      return withFar(13, [
        silverRow(silverAlmost({ plate: 7, cell: "pending" }), {
          currentPlate: 7,
        }),
      ]);
    case "verified":
    case "collected":
      return withFar(14, [
        silverRow(silverAlmost({ plate: 7, cell: "verified" }), {
          currentPlate: state === "verified" ? 7 : null,
          hitPlate: state === "collected" ? 7 : null,
        }),
      ]);
    case "tier-reached": {
      const trophyTier = options.trophyTier ?? "Pro";
      return {
        ...withFar(16, [
          silverRow(silverForTrophyTier(trophyTier), { currentPlate: 19 }),
        ]),
        activePlate: {
          plate: "19",
          code: "3MV8",
          title: "Plate 19",
          bookTitle: SAMPLE_SILVER.title,
        },
        trophyTier,
      };
    }
    case "legendary-found":
      return {
        ...withFar(9, [
          silverRow(silverLegendary(), {
            currentPlate: 31,
            legendaryPlate: 31,
            legendaryFoundAt: 23,
          }),
        ]),
        activePlate: {
          plate: "31",
          code: "9TD4",
          title: "Plate 31",
          bookTitle: SAMPLE_SILVER.title,
        },
        trophyTier: options.trophyTier ?? "Legendary",
      };
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function fixtureActivePlate(state: ScanViewState): ActivePlate {
  return fixtureSnapshot(state).activePlate ?? SAMPLE_PAGE;
}

export function createFixtureAdapter(state: ScanViewState): ScanLedgerAdapter {
  const snapshot = fixtureSnapshot(state);
  return {
    async getLedger() {
      return snapshot;
    },
    async registerBook({ userId }) {
      if (!userId) {
        return {
          ok: false,
          kind: "signed-out",
          hold: { kind: "book", label: SAMPLE_SILVER.title },
        };
      }
      return {
        ok: true,
        kind: "registered",
        snapshot: fixtureSnapshot("registered"),
      };
    },
    async submitPageCode({ userId, code }) {
      const normalized = code.trim().toUpperCase();
      if (normalized === SAMPLE_BAD_CODE) {
        return {
          ok: false,
          kind: "invalid",
          code: normalized,
          message: `${normalized} isn't in any of our books. Check the letters by the page number.`,
        };
      }
      if (!userId) {
        return {
          ok: false,
          kind: "signed-out",
          hold: {
            kind: "page-plus",
            label: normalized || SAMPLE_PAGE.code,
          },
        };
      }
      if (state === "collected" || state === "verified") {
        return {
          ok: true,
          kind: "collected",
          code: SAMPLE_PAGE.code,
          plate: SAMPLE_PAGE,
          snapshot: fixtureSnapshot("collected"),
        };
      }
      if (state === "pending") {
        return {
          ok: true,
          kind: "pending",
          code: SAMPLE_PAGE.code,
          plate: SAMPLE_PAGE,
          snapshot: fixtureSnapshot("pending"),
        };
      }
      if (state === "code-only-before" || state === "code-added") {
        return {
          ok: true,
          kind: "code-only-before",
          code: SAMPLE_PAGE.code,
          plate: SAMPLE_PAGE,
          snapshot: fixtureSnapshot("code-only-before"),
        };
      }
      return {
        ok: true,
        kind: "code-added",
        code: SAMPLE_PAGE.code,
        plate: SAMPLE_PAGE,
        snapshot: fixtureSnapshot("code-added"),
      };
    },
    async submitPagePhoto({ userId }) {
      if (!userId) {
        return {
          ok: false,
          kind: "signed-out",
          hold: {
            kind: "page-plus",
            label: SAMPLE_PAGE.code,
          },
        };
      }
      return {
        ok: true,
        kind: "pending",
        snapshot: fixtureSnapshot("pending"),
      };
    },
  };
}

export function fixtureRegisteredNext(): string {
  return nextTierCopy(0, SAMPLE_SILVER.plates);
}

export { SCAN_STUB, plateLabel };
