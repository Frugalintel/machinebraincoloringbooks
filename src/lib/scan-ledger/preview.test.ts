import { describe, expect, it } from "vitest";
import {
  SCAN_PREVIEW_STATES,
  scanPreview,
  scanPreviewCameraIssue,
  scanPreviewTrophyTier,
} from "@/lib/scan-ledger/preview";
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
    expect(scanPreview(true, "camera-insecure")).toBe("camera-off");
    expect(scanPreview(true, "camera-none")).toBe("camera-off");
    expect(scanPreviewCameraIssue(true, "camera-insecure")).toEqual({
      kind: "insecure",
    });
    expect(scanPreviewCameraIssue(true, "camera-none")).toEqual({
      kind: "not-found",
    });
    expect(scanPreviewCameraIssue(true, "camera-off")).toEqual({
      kind: "denied",
    });
    expect(scanPreviewCameraIssue(false, "camera-insecure")).toBeNull();
  });

  it("opens Basic and Rare trophy fixtures without enabling them in production", () => {
    expect(scanPreview(false, "basic")).toBeNull();
    expect(scanPreviewTrophyTier(false, "basic")).toBeNull();
    expect(scanPreview(true, "basic")).toBe("tier-reached");
    expect(scanPreviewTrophyTier(true, "basic")).toBe("Basic");
    expect(scanPreview(true, "rare")).toBe("tier-reached");
    expect(scanPreviewTrophyTier(true, "rare")).toBe("Rare");
    expect(scanPreview(false, "pro")).toBeNull();
    expect(scanPreview(true, "pro")).toBe("tier-reached");
    expect(scanPreviewTrophyTier(true, "pro")).toBe("Pro");
    expect(scanPreview(true, "legendary")).toBe("legendary-found");
    expect(scanPreviewTrophyTier(true, "legendary")).toBe("Legendary");
    expect(scanPreviewTrophyTier(true, "tier-reached")).toBeNull();
    expect(
      fixtureSnapshot("tier-reached", { trophyTier: "Basic" }).trophyTier,
    ).toBe("Basic");
    expect(
      fixtureSnapshot("tier-reached", { trophyTier: "Basic" }).books[0]?.tier,
    ).toBe("Basic");
    expect(
      fixtureSnapshot("tier-reached", { trophyTier: "Rare" }).books[0]?.tier,
    ).toBe("Rare");
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
    expect(
      fixtureSnapshot("tier-reached", { trophyTier: "Basic" }).books[0]
        ?.bookPoints,
    ).toBe(41);
    expect(
      fixtureSnapshot("tier-reached", { trophyTier: "Rare" }).books[0]
        ?.bookPoints,
    ).toBe(55);
    expect(fixtureSnapshot("code").books[0]?.bookPoints).toBe(41);
    expect(fixtureSnapshot("registered").books[0]?.isNew).toBe(true);
  });
});
