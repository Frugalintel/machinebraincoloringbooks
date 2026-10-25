import { describe, expect, it } from "vitest";
import {
  CELL_LABEL,
  PHOTO_OPTIONAL,
  SCAN_WALLET_FROM_POINTS,
  SCAN_WALLET_LABEL,
  legendaryPlateCaption,
  plateCellLabel,
  sampleNote,
  scanChrome,
  trophyPlateCaption,
} from "@/lib/scan-ledger/copy";

describe("scan ledger copy", () => {
  it("keeps wallet labels free of XP", () => {
    expect(SCAN_WALLET_LABEL).toBe("Wallet · for stories");
    expect(SCAN_WALLET_FROM_POINTS).toBe("Wallet · from your points");
    expect(SCAN_WALLET_FROM_POINTS).not.toMatch(/XP/i);
  });

  it("uses the locked photo running line", () => {
    expect(PHOTO_OPTIONAL).toBe("Optional · +1 more once verified");
    expect(scanChrome("photo").lede).toBe(
      "Fit the whole colored page in the frame.",
    );
    expect(scanChrome("photo-preview").lede).toBe(
      "Sharp, flat, the whole page in view. Then send it.",
    );
  });

  it("aligns cell tooltips with the mockup", () => {
    expect(CELL_LABEL.pending).toBe("code 1 pt + photo pending verification");
    expect(CELL_LABEL.legendary).toBe(
      "Legendary page: code + verified photo, 2 pts",
    );
  });

  it("uses the locked sample notes", () => {
    expect(sampleNote("registered")).toBe(
      "Example · sample books, unlock and points",
    );
    expect(sampleNote("legendary-found")).toBe(
      "Example · a separate, earlier moment in the same book",
    );
    expect(sampleNote("code")).toBe("Example · sample book, code and points");
  });

  it("puts the folio into the trophy caption", () => {
    expect(trophyPlateCaption("19", "3MV8")).toBe(
      "PLATE 19 · 3MV8 · CODE + PHOTO",
    );
    expect(trophyPlateCaption("31", "9TD4")).toBe(
      "PLATE 31 · 9TD4 · CODE + PHOTO",
    );
    expect(legendaryPlateCaption("31")).toBe("PLATE 31 · HIDDEN PAGE");
  });

  it("restores the mockup now-cell labels", () => {
    expect(
      plateCellLabel("code", { state: "code-only-before", highlight: true }),
    ).toBe("code counted, photo still open");
    expect(
      plateCellLabel("verified", { state: "collected", highlight: true }),
    ).toBe("collected already, code and page");
    expect(
      plateCellLabel("verified", { state: "tier-reached", highlight: true }),
    ).toBe("photo just verified, 2 pts");
    expect(plateCellLabel("code")).toBe(CELL_LABEL.code);
    expect(
      plateCellLabel("code", { state: "code-only-before", highlight: false }),
    ).toBe(CELL_LABEL.code);
  });
});
