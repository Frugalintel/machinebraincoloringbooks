import { describe, expect, it } from "vitest";
import {
  FOOTER_LINK_GROUPS,
  SITE_NAV_LINKS,
  SITE_SOCIAL_LINKS,
  headerVariantFor,
  hidesCustomerFooter,
  isNavLinkActive,
  isOverlayLinkCurrent,
  isStorePath,
  overlayLinksFor,
} from "@/lib/site-shell";

describe("site shell routes", () => {
  it("keeps the existing customer nav destinations", () => {
    expect(SITE_NAV_LINKS.map((link) => link.href)).toEqual([
      "/store",
      "/stories",
      "/collectibles",
      "/about",
    ]);
  });

  it("keeps account, help, and legal footer destinations", () => {
    const hrefs = FOOTER_LINK_GROUPS.flatMap((group) =>
      group.links.map((link) => link.href),
    );
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/store",
        "/stories",
        "/collectibles",
        "/about",
        "/auth?mode=login",
        "/auth?mode=register",
        "/orders/lookup",
        "/help",
        "/terms",
        "/privacy",
        "/licenses",
      ]),
    );
  });

  it("does not invent social URLs", () => {
    expect(SITE_SOCIAL_LINKS).toEqual([]);
    expect(
      SITE_SOCIAL_LINKS.every((link) => /^https:\/\//.test(link.href)),
    ).toBe(true);
  });
});

describe("headerVariantFor", () => {
  it("uses the full chrome on customer pages outside home, the store, and stories", () => {
    expect(headerVariantFor("/collectibles")).toBe("full");
    expect(headerVariantFor("/help")).toBe("full");
    expect(hidesCustomerFooter("/collectibles")).toBe(false);
  });

  it("gives stories the store nav, plus Stories, and lets the page own its footer", () => {
    expect(headerVariantFor("/stories")).toBe("solid");
    expect(headerVariantFor("/stories/lantern")).toBe("solid");
    expect(headerVariantFor("/storyteller")).toBe("full");
    expect(hidesCustomerFooter("/stories")).toBe(true);
    expect(hidesCustomerFooter("/stories/lantern")).toBe(true);
    expect(overlayLinksFor("/stories").map((link) => link.name)).toEqual([
      "Books",
      "Worlds",
      "Stories",
      "About",
    ]);
    expect(overlayLinksFor("/stories/1").map((link) => link.href)).toEqual([
      "/store",
      "/store#worlds",
      "/stories",
      "/about",
    ]);
    expect(
      isOverlayLinkCurrent("/stories/1", { name: "Stories", href: "/stories" }),
    ).toBe(true);
    expect(
      isOverlayLinkCurrent("/stories", { name: "Books", href: "/store" }),
    ).toBe(false);
    expect(
      isOverlayLinkCurrent("/store", { name: "Worlds", href: "/store#worlds" }),
    ).toBe(false);
  });

  it("gives the store Home's nav on a solid bar and lets it own its footer", () => {
    expect(headerVariantFor("/store")).toBe("solid");
    expect(headerVariantFor("/store/1")).toBe("solid");
    expect(headerVariantFor("/stores")).toBe("full");
    expect(isStorePath("/store")).toBe(true);
    expect(isStorePath("/store/abc")).toBe(true);
    expect(isStorePath("/storefront")).toBe(false);
    expect(hidesCustomerFooter("/store")).toBe(true);
    expect(hidesCustomerFooter("/store/1")).toBe(true);
    expect(overlayLinksFor("/store/1").map((link) => link.href)).toEqual([
      "/store",
      "/store#worlds",
      "/about",
    ]);
  });

  it("overlays the nav on the home hero and lets home own its footer", () => {
    expect(headerVariantFor("/")).toBe("overlay");
    expect(hidesCustomerFooter("/")).toBe(true);
  });

  it("overlays the nav on the sign-in plate, which owns Home's footer", () => {
    expect(headerVariantFor("/auth")).toBe("overlay");
    expect(hidesCustomerFooter("/auth")).toBe(true);
    expect(overlayLinksFor("/auth").map((link) => link.href)).toEqual([
      "/store",
      "/stories",
      "/about",
    ]);
    expect(overlayLinksFor("/").map((link) => link.name)).toEqual([
      "Books",
      "Worlds",
      "About",
    ]);
  });

  it("uses the minimal lockup header on scan and review", () => {
    expect(headerVariantFor("/auth/callback")).toBe("minimal");
    expect(headerVariantFor("/scan")).toBe("minimal");
    expect(headerVariantFor("/review")).toBe("minimal");
    expect(headerVariantFor("/review/ottoline-garden")).toBe("minimal");
  });

  it("hides customer chrome on admin", () => {
    expect(headerVariantFor("/admin")).toBe("hidden");
    expect(headerVariantFor("/admin/products")).toBe("hidden");
    expect(hidesCustomerFooter("/admin")).toBe(true);
    expect(hidesCustomerFooter("/scan")).toBe(true);
  });
});

describe("isNavLinkActive", () => {
  it("matches a section and its children", () => {
    expect(isNavLinkActive("/store", "/store")).toBe(true);
    expect(isNavLinkActive("/store/1", "/store")).toBe(true);
    expect(isNavLinkActive("/stories", "/store")).toBe(false);
  });
});
