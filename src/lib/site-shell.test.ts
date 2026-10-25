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
  usesHomeFooterPlate,
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
  it("uses the full chrome on customer pages outside home, the store, stories, and collectibles", () => {
    expect(headerVariantFor("/help")).toBe("full");
    expect(headerVariantFor("/about")).toBe("full");
    expect(headerVariantFor("/trophy-room")).toBe("full");
    expect(headerVariantFor("/privacy")).toBe("full");
    expect(hidesCustomerFooter("/trophy-room")).toBe(false);
    expect(hidesCustomerFooter("/privacy")).toBe(false);
    expect(hidesCustomerFooter("/licenses")).toBe(false);
  });

  it("gives /about and /help the HomeFooter plate and hides the customer footer", () => {
    expect(usesHomeFooterPlate("/about")).toBe(true);
    expect(usesHomeFooterPlate("/help")).toBe(true);
    expect(usesHomeFooterPlate("/")).toBe(true);
    expect(usesHomeFooterPlate("/privacy")).toBe(false);
    expect(usesHomeFooterPlate("/collectibles")).toBe(true);
    expect(hidesCustomerFooter("/about")).toBe(true);
    expect(hidesCustomerFooter("/help")).toBe(true);
    expect(hidesCustomerFooter("/help/")).toBe(true);
  });

  it("gives collectibles the stories nav and lets the page own its footer", () => {
    expect(headerVariantFor("/collectibles")).toBe("solid");
    expect(headerVariantFor("/collectibles/rover-x")).toBe("solid");
    expect(headerVariantFor("/collectible")).toBe("full");
    expect(hidesCustomerFooter("/collectibles")).toBe(true);
    expect(hidesCustomerFooter("/collectibles/rover-x")).toBe(true);
    expect(overlayLinksFor("/collectibles").map((link) => link.name)).toEqual([
      "Books",
      "Worlds",
      "Stories",
      "About",
    ]);
    expect(
      overlayLinksFor("/collectibles/rover-x").map((link) => link.href),
    ).toEqual(["/store", "/store#worlds", "/stories", "/about"]);
    expect(
      isOverlayLinkCurrent("/collectibles", {
        name: "Stories",
        href: "/stories",
      }),
    ).toBe(false);
    expect(
      isOverlayLinkCurrent("/collectibles", {
        name: "Books",
        href: "/store",
      }),
    ).toBe(false);
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
    expect(overlayLinksFor("/").map((link) => [link.name, link.href])).toEqual([
      ["Books", "/store"],
      ["Worlds", "/store"],
      ["Stories", "/stories"],
      ["About", "/about"],
    ]);
  });

  it("uses the minimal lockup header on review", () => {
    expect(headerVariantFor("/auth/callback")).toBe("minimal");
    expect(headerVariantFor("/review")).toBe("minimal");
    expect(headerVariantFor("/review/ottoline-garden")).toBe("minimal");
  });

  it("gives /scan the stories nav and lets the page own its footer", () => {
    expect(headerVariantFor("/scan")).toBe("solid");
    expect(hidesCustomerFooter("/scan")).toBe(true);
    expect(overlayLinksFor("/scan").map((link) => link.name)).toEqual([
      "Books",
      "Worlds",
      "Stories",
      "About",
    ]);
  });

  it("hides customer chrome on admin", () => {
    expect(headerVariantFor("/admin")).toBe("hidden");
    expect(headerVariantFor("/admin/products")).toBe("hidden");
    expect(hidesCustomerFooter("/admin")).toBe(true);
  });
});

describe("isNavLinkActive", () => {
  it("matches a section and its children", () => {
    expect(isNavLinkActive("/store", "/store")).toBe(true);
    expect(isNavLinkActive("/store/1", "/store")).toBe(true);
    expect(isNavLinkActive("/stories", "/store")).toBe(false);
  });
});
