import { describe, expect, it } from "vitest";
import {
  TIER_NAME_RARE,
  legendaryFoundRange,
  maxBookPoints,
  nextTierCopy,
  tierOf,
  tiers,
} from "@/lib/scan-tiers";

describe("tiers", () => {
  it("matches the locked 40-page example (40 / 45 / 55 / 80)", () => {
    expect(tiers(40).map((tier) => [tier.name, tier.points])).toEqual([
      ["Basic", 40],
      ["Pro", 45],
      [TIER_NAME_RARE, 55],
    ]);
    expect(maxBookPoints(40)).toBe(80);
    expect(legendaryFoundRange(40)).toEqual({ min: 2, max: 80 });
  });

  it("matches the 24-page Far Station example (24 / 27 / 33 / 48)", () => {
    expect(tiers(24).map((tier) => [tier.name, tier.points])).toEqual([
      ["Basic", 24],
      ["Pro", 27],
      [TIER_NAME_RARE, 33],
    ]);
    expect(maxBookPoints(24)).toBe(48);
  });

  it("rejects non-positive page counts", () => {
    expect(() => tiers(0)).toThrow(RangeError);
    expect(() => tiers(-1)).toThrow(RangeError);
    expect(() => tiers(1.5)).toThrow(RangeError);
  });

  it("keeps the Rare label in one constant", () => {
    expect(TIER_NAME_RARE).toBe("Rare");
    expect(tiers(8)[2]?.name).toBe(TIER_NAME_RARE);
  });
});

describe("tierOf", () => {
  it("is points-only, so 41 pts on a 40-page book is already Basic", () => {
    expect(tierOf(0, 40)).toBe("No tier yet");
    expect(tierOf(39, 40)).toBe("No tier yet");
    expect(tierOf(40, 40)).toBe("Basic");
    expect(tierOf(41, 40)).toBe("Basic");
    expect(tierOf(45, 40)).toBe("Pro");
    expect(tierOf(55, 40)).toBe(TIER_NAME_RARE);
    expect(tierOf(80, 40)).toBe(TIER_NAME_RARE);
  });

  it("treats the hidden page as Legendary and includes the lower tiers", () => {
    expect(tierOf(23, 40, true)).toBe("Legendary");
    expect(nextTierCopy(23, 40, { legendary: true })).toBe(
      "Includes Basic, Pro and Rare",
    );
  });
});

describe("nextTierCopy", () => {
  it("uses pts until every code is in, then photos", () => {
    expect(nextTierCopy(41, 40)).toBe("Pro in 4 more pts");
    expect(nextTierCopy(42, 40, { allCodesIn: true })).toBe(
      "Pro in 3 more photos",
    );
    expect(nextTierCopy(42, 40, { allCodesIn: true, pending: 1 })).toBe(
      "Pro in 3 more photos · 1 pending",
    );
    expect(nextTierCopy(44, 40, { allCodesIn: true })).toBe(
      "Pro in 1 more photo",
    );
    expect(nextTierCopy(55, 40)).toBe(
      "Rare reached · Legendary is a hidden page",
    );
  });

  it("uses the registered-book wording for zero points", () => {
    expect(nextTierCopy(0, 40)).toBe("Basic in 40 more pts");
    expect(nextTierCopy(12, 24)).toBe("Basic in 12 more pts");
  });
});
