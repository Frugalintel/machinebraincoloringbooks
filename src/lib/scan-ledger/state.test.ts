import { describe, expect, it } from "vitest";
import {
  deriveBookRow,
  deriveCodeOutcome,
  folioLine,
  isPlausiblePageCode,
  normalizeBookCode,
  profileProgressFromLedger,
  storyBarWidth,
} from "@/lib/scan-ledger/state";
import { TIER_NAME_RARE } from "@/lib/scan-tiers";

describe("normalizeBookCode", () => {
  it("trims and upper-cases typed folio codes", () => {
    expect(normalizeBookCode("  7kq2 \n")).toBe("7KQ2");
    expect(normalizeBookCode("pl-07")).toBe("PL-07");
  });

  it("accepts short printed codes and rejects empty ones", () => {
    expect(isPlausiblePageCode("7KQ2")).toBe(true);
    expect(isPlausiblePageCode("AB")).toBe(true);
    expect(isPlausiblePageCode("A")).toBe(false);
    expect(isPlausiblePageCode("")).toBe(false);
    expect(isPlausiblePageCode("7KQ2!")).toBe(false);
  });
});

describe("deriveCodeOutcome", () => {
  it("maps existing rows onto the locked prompts", () => {
    expect(deriveCodeOutcome(null)).toBe("invalid");
    expect(deriveCodeOutcome({ hasCode: false, scanStatus: null })).toBe(
      "code-added",
    );
    expect(deriveCodeOutcome({ hasCode: true, scanStatus: null })).toBe(
      "code-only-before",
    );
    expect(deriveCodeOutcome({ hasCode: true, scanStatus: "pending" })).toBe(
      "pending",
    );
    expect(deriveCodeOutcome({ hasCode: true, scanStatus: "approved" })).toBe(
      "collected",
    );
    expect(deriveCodeOutcome({ hasCode: true, scanStatus: "rejected" })).toBe(
      "code-only-before",
    );
  });
});

describe("deriveBookRow", () => {
  it("counts code as +1 and approved photo as +1 more", () => {
    const row = deriveBookRow({
      id: "s",
      title: "The Silver Citadel",
      plates: ["verified", "code", "pending", "empty"],
    });
    expect(row.bookPoints).toBe(4);
    expect(row.pendingCount).toBe(1);
    expect(row.allCodesIn).toBe(false);
    expect(row.tier).toBe("Basic");
  });

  it("marks Legendary from the found-at tag, not from points", () => {
    const row = deriveBookRow({
      id: "s",
      title: "The Silver Citadel",
      plates: Array.from({ length: 40 }, () => "empty"),
      legendaryFoundAt: 23,
      legendaryPlate: 31,
    });
    expect(row.tier).toBe("Legendary");
    expect(row.next).toBe(`Includes Basic, Pro and ${TIER_NAME_RARE}`);
    expect(folioLine(7, "7KQ2")).toBe("PL. 07 · 7KQ2");
  });
});

describe("profileProgressFromLedger", () => {
  it("counts filled plates and pending photos the same way /scan does", () => {
    const book = deriveBookRow({
      id: "s",
      title: "The Silver Citadel",
      plates: [
        ...Array.from({ length: 7 }, () => "code" as const),
        ...Array.from({ length: 3 }, () => "pending" as const),
        ...Array.from({ length: 30 }, () => "empty" as const),
      ],
    });
    expect(
      profileProgressFromLedger({
        signedIn: true,
        sample: false,
        wallet: { available: false, points: null, source: "unavailable" },
        story: null,
        books: [book],
        showNextBookSlot: false,
        activePlate: null,
        unlock: null,
      }),
    ).toEqual({
      plateCount: 10,
      pendingCount: 3,
      bookCount: 1,
    });
  });

  it("is empty when the ledger has not loaded", () => {
    expect(profileProgressFromLedger(null)).toEqual({
      plateCount: 0,
      pendingCount: 0,
      bookCount: 0,
    });
  });
});

describe("storyBarWidth", () => {
  it("caps at 100 and treats a missing wallet as empty", () => {
    expect(storyBarWidth(12, 30)).toBe(40);
    expect(storyBarWidth(16, 30)).toBe(53);
    expect(storyBarWidth(null, 30)).toBe(0);
    expect(storyBarWidth(90, 30)).toBe(100);
  });
});
