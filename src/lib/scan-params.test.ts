import { describe, expect, it } from "vitest";
import { normalizeBookCode, scanEntryFromParams } from "@/lib/scan-params";

describe("normalizeBookCode", () => {
  it("trims and upper-cases before any lookup", () => {
    expect(normalizeBookCode("  ab12 \n")).toBe("AB12");
    expect(normalizeBookCode("MB-gns-001")).toBe("MB-GNS-001");
    expect(normalizeBookCode("   ")).toBe("");
  });
});

describe("scanEntryFromParams", () => {
  it("opens manual entry with the typed code from the home form", () => {
    expect(
      scanEntryFromParams(new URLSearchParams("mode=code&code=+ab12+")),
    ).toEqual({ mode: "code", code: "AB12" });
  });

  it("opens empty manual entry from the footer link", () => {
    expect(scanEntryFromParams(new URLSearchParams("mode=code"))).toEqual({
      mode: "code",
      code: "",
    });
  });

  it("keeps the camera flow for every other URL", () => {
    expect(scanEntryFromParams(new URLSearchParams(""))).toEqual({
      mode: "camera",
    });
    expect(scanEntryFromParams(new URLSearchParams("code=ab12"))).toEqual({
      mode: "camera",
    });
    expect(
      scanEntryFromParams(new URLSearchParams("mode=camera&code=ab12")),
    ).toEqual({ mode: "camera" });
  });
});
