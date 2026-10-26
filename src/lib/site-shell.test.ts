import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FOOTER_LINK_GROUPS,
  HOME_FOOTER_ROUTES,
  LEGACY_FOOTER_ROUTES,
  SITE_NAV_LINKS,
  SITE_SOCIAL_LINKS,
  headerVariantFor,
  hidesCustomerFooter,
  isAdminPath,
  isMinimalChromePath,
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
  it("uses the compact solid header on customer routes other than home and sign-in", () => {
    for (const path of [
      "/help",
      "/about",
      "/trophy-room",
      "/privacy",
      "/terms",
      "/licenses",
      "/orders/lookup",
      "/zz-not-a-page",
      "/game",
      "/collectible",
      "/storyteller",
      "/stores",
    ]) {
      expect(headerVariantFor(path)).toBe("solid");
    }
    expect(headerVariantFor("/")).toBe("overlay");
    expect(headerVariantFor("/auth")).toBe("overlay");
    expect(headerVariantFor("/admin")).toBe("hidden");
    expect(headerVariantFor("/review")).toBe("minimal");
  });

  it("gives customer routes the HomeFooter plate, except pages that still own a legacy footer", () => {
    for (const path of [
      "/",
      "/auth",
      "/about",
      "/help",
      "/help/",
      "/privacy",
      "/terms",
      "/licenses",
      "/trophy-room",
      "/orders/lookup",
      "/store",
      "/collectibles",
      "/zz-not-a-page",
    ]) {
      expect(usesHomeFooterPlate(path)).toBe(true);
      expect(hidesCustomerFooter(path)).toBe(true);
    }
    expect(usesHomeFooterPlate("/game")).toBe(true);
    expect(hidesCustomerFooter("/game")).toBe(true);
    expect(usesHomeFooterPlate("/profile/me")).toBe(true);
    expect(usesHomeFooterPlate("/achievements")).toBe(true);
    expect(usesHomeFooterPlate("/dev/components")).toBe(false);
    expect(hidesCustomerFooter("/dev/components")).toBe(false);
    expect(hidesCustomerFooter("/admin")).toBe(true);
    expect(usesHomeFooterPlate("/admin")).toBe(false);
    expect(hidesCustomerFooter("/review")).toBe(true);
  });

  it("gives collectibles the stories nav and lets the page own its footer", () => {
    expect(headerVariantFor("/collectibles")).toBe("solid");
    expect(headerVariantFor("/collectibles/rover-x")).toBe("solid");
    expect(headerVariantFor("/collectible")).toBe("solid");
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
    expect(headerVariantFor("/storyteller")).toBe("solid");
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
    expect(headerVariantFor("/stores")).toBe("solid");
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

function pageRoutes(dir: string, parts: string[] = []): string[] {
  const routes: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name.startsWith("(") && name.endsWith(")")) {
        routes.push(...pageRoutes(full, parts));
      } else {
        const segment = name.startsWith("[") ? "example" : name;
        routes.push(...pageRoutes(full, [...parts, segment]));
      }
      continue;
    }
    if (name === "page.tsx") {
      routes.push(parts.length === 0 ? "/" : `/${parts.join("/")}`);
    }
  }
  return routes;
}

function listed(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) =>
    route === "/"
      ? pathname === "/"
      : pathname === route || pathname.startsWith(`${route}/`),
  );
}

describe("footer registration", () => {
  it("names every page as a plate, the legacy footer, or hidden chrome", () => {
    const pages = pageRoutes(join(process.cwd(), "src/app"));
    const missed = pages.filter((route) => {
      if (isAdminPath(route) || isMinimalChromePath(route)) return false;
      if (listed(route, LEGACY_FOOTER_ROUTES)) return false;
      if (listed(route, HOME_FOOTER_ROUTES)) return false;
      return true;
    });
    expect(missed).toEqual([]);

    for (const route of pages) {
      if (isAdminPath(route) || isMinimalChromePath(route)) {
        expect(hidesCustomerFooter(route)).toBe(true);
        expect(usesHomeFooterPlate(route)).toBe(false);
      } else if (listed(route, LEGACY_FOOTER_ROUTES)) {
        expect(usesHomeFooterPlate(route)).toBe(false);
        expect(hidesCustomerFooter(route)).toBe(false);
      } else {
        expect(usesHomeFooterPlate(route)).toBe(true);
        expect(hidesCustomerFooter(route)).toBe(true);
      }
    }

    expect(usesHomeFooterPlate("/zz-not-a-page")).toBe(true);
    expect(hidesCustomerFooter("/dev")).toBe(false);
  });
});
