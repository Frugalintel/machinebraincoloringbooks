/**
 * Customer chrome: routes, legal, and social destinations.
 * Keep this list in lockstep with the live header and footer.
 */

export type SiteLink = {
  name: string;
  href: string;
};

export type FooterLinkGroup = {
  heading: string;
  links: readonly SiteLink[];
};

/**
 * "overlay": home and /auth draw the nav over their first plate and own their footer.
 * "solid": the compact text nav on near-black. Customer routes use this.
 * "full" remains in the union so the legacy header can still compile, and is
 * not returned for customer routes.
 */
export type HeaderVariant = "full" | "overlay" | "solid" | "minimal" | "hidden";

export const SITE_NAV_LINKS: readonly SiteLink[] = [
  { name: "Store", href: "/store" },
  { name: "Stories", href: "/stories" },
  { name: "Collectibles", href: "/collectibles" },
  { name: "About", href: "/about" },
];

export const FOOTER_LINK_GROUPS: readonly FooterLinkGroup[] = [
  {
    heading: "Shop",
    links: SITE_NAV_LINKS,
  },
  {
    heading: "Account",
    links: [
      { name: "Sign in", href: "/auth?mode=login" },
      { name: "Register", href: "/auth?mode=register" },
      { name: "Order lookup", href: "/orders/lookup" },
      { name: "Help", href: "/help" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { name: "Terms", href: "/terms" },
      { name: "Privacy", href: "/privacy" },
      { name: "Licenses", href: "/licenses" },
    ],
  },
];

/**
 * Public social destinations.
 *
 * None exist in this repo. Do not invent URLs.
 * Add `{ name, href }` entries here when a channel is published.
 */
export const SITE_SOCIAL_LINKS: readonly SiteLink[] = [];

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Over-plate nav on Home. Worlds stays /store; Stories sits between Worlds and About. */
export const HOME_OVERLAY_LINKS: readonly SiteLink[] = [
  { name: "Books", href: "/store" },
  { name: "Worlds", href: "/store" },
  { name: "Stories", href: "/stories" },
  { name: "About", href: "/about" },
];

export const AUTH_OVERLAY_LINKS: readonly SiteLink[] = [
  { name: "Books", href: "/store" },
  { name: "Stories", href: "/stories" },
  { name: "About", href: "/about" },
];

/** The store already is "Books", so Worlds jumps to its world filter. */
export const STORE_NAV_LINKS: readonly SiteLink[] = [
  { name: "Books", href: "/store" },
  { name: "Worlds", href: "/store#worlds" },
  { name: "About", href: "/about" },
];

/**
 * Stories and collectibles share this solid nav.
 * Worlds stays on the store filter: there is no /worlds route yet.
 */
export const STORIES_NAV_LINKS: readonly SiteLink[] = [
  { name: "Books", href: "/store" },
  { name: "Worlds", href: "/store#worlds" },
  { name: "Stories", href: "/stories" },
  { name: "About", href: "/about" },
];

export function isStoriesPath(pathname: string): boolean {
  return pathname === "/stories" || pathname.startsWith("/stories/");
}

export function isCollectiblesPath(pathname: string): boolean {
  return pathname === "/collectibles" || pathname.startsWith("/collectibles/");
}

export function isScanPath(pathname: string): boolean {
  return pathname === "/scan" || pathname.startsWith("/scan/");
}

export function isAboutPath(pathname: string): boolean {
  return pathname === "/about" || pathname.startsWith("/about/");
}

export function isHelpPath(pathname: string): boolean {
  return pathname === "/help" || pathname.startsWith("/help/");
}

export function isStorePath(pathname: string): boolean {
  return pathname === "/store" || pathname.startsWith("/store/");
}

/**
 * Real pages that still render the legacy footer.
 * Trophy room, legal, order lookup, and unknown URLs (the 404) own HomeFooter.
 */
function keepsLegacyFooter(pathname: string): boolean {
  return (
    pathname === "/game" ||
    pathname.startsWith("/game/") ||
    pathname === "/achievements" ||
    pathname.startsWith("/achievements/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/dev" ||
    pathname.startsWith("/dev/")
  );
}

/**
 * Pages that own the "Take your time." HomeFooter plate.
 * Keep this in lockstep with the layouts that render <HomeFooter />.
 * Unknown customer URLs render root not-found, which owns the plate too.
 */
export function usesHomeFooterPlate(pathname: string): boolean {
  if (isAdminPath(pathname) || isMinimalChromePath(pathname)) return false;
  if (keepsLegacyFooter(pathname)) return false;
  return true;
}

export function overlayLinksFor(pathname: string): readonly SiteLink[] {
  if (
    isStoriesPath(pathname) ||
    isCollectiblesPath(pathname) ||
    isScanPath(pathname)
  ) {
    return STORIES_NAV_LINKS;
  }
  if (isStorePath(pathname)) return STORE_NAV_LINKS;
  return pathname === "/auth" ? AUTH_OVERLAY_LINKS : HOME_OVERLAY_LINKS;
}

export function isOverlayLinkCurrent(
  pathname: string,
  link: SiteLink,
): boolean {
  if (link.href.includes("#")) return false;
  if (link.href === "/store") return isStorePath(pathname);
  return isNavLinkActive(pathname, link.href);
}

export function isMinimalChromePath(pathname: string): boolean {
  return (
    pathname.startsWith("/auth/") ||
    pathname === "/review" ||
    pathname.startsWith("/review/")
  );
}

export function headerVariantFor(pathname: string): HeaderVariant {
  if (isAdminPath(pathname)) {
    return "hidden";
  }
  if (isMinimalChromePath(pathname)) {
    return "minimal";
  }
  if (pathname === "/" || pathname === "/auth") {
    return "overlay";
  }
  return "solid";
}

export function hidesCustomerFooter(pathname: string): boolean {
  if (isAdminPath(pathname) || isMinimalChromePath(pathname)) return true;
  return usesHomeFooterPlate(pathname);
}

export function cartLabel(count: number): string {
  return `Cart, ${count} ${count === 1 ? "item" : "items"}`;
}

export function isNavLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Visible focus ring for shell controls.
 * Cream on near-black. Light plates set --shell-focus to ink.
 */
export const SHELL_FOCUS = "shell-focus";
