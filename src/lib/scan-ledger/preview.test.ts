import { describe, expect, it } from "vitest";
import { SCAN_PREVIEW_STATES, scanPreview } from "@/lib/scan-ledger/preview";
import { fixtureSnapshot } from "@/lib/scan-ledger/fixture";

describe("scanPreview", () => {
  it("is off in production builds", () => {
    expect(scanPreview(false, "code")).toBeNull();
    expect(scanPreview(false, "index")).toBeNull();
  });

  it("exposes all 16 locked states and the qr alias", () => {
    expect(SCAN_PREVIEW_STATES).toHaveLength(16);
    for (const state of SCAN_PREVIEW_STATES) {
      expect(scanPreview(true, state)).toBe(state);
    }
    expect(scanPreview(true, "qr")).toBe("index");
    expect(scanPreview(true, "nope")).toBeNull();
  });
});

describe("fixtureSnapshot", () => {
  it("keeps the sample moments honest", () => {
    expect(fixtureSnapshot("code").wallet.points).toBe(12);
    expect(fixtureSnapshot("code-added").wallet.points).toBe(13);
    expect(fixtureSnapshot("verified").wallet.points).toBe(14);
    expect(fixtureSnapshot("tier-reached").wallet.points).toBe(16);
    expect(fixtureSnapshot("legendary-found").wallet.points).toBe(9);
    expect(fixtureSnapshot("signed-out-book").signedIn).toBe(false);
    expect(fixtureSnapshot("legendary-found").books[0]?.legendaryFoundAt).toBe(
      23,
    );
    expect(fixtureSnapshot("tier-reached").books[0]?.bookPoints).toBe(45);
    expect(fixtureSnapshot("code").books[0]?.bookPoints).toBe(41);
    expect(fixtureSnapshot("registered").books[0]?.isNew).toBe(true);
  });
});
