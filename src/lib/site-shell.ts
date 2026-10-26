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
 * "solid": the same home nav on near-black; the store, stories, collectibles, and scan use it.
 * "full": the approved customer header on the other routes, including /about and /help.
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
      { name: "Create account", href: "/auth?mode=register" },
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
 * Routes whose layout (or page) renders <HomeFooter />.
 * A new page must be added here or to LEGACY_FOOTER_ROUTES.
 * site-shell.test.ts fails until that happens.
 */
export const HOME_FOOTER_ROUTES = [
  "/",
  "/auth",
  "/about",
  "/help",
  "/store",
  "/stories",
  "/collectibles",
  "/scan",
  "/trophy-room",
  "/privacy",
  "/terms",
  "/licenses",
  "/orders/lookup",
  "/game",
  "/achievements",
  "/profile",
] as const;

/** Real pages that still render the legacy footer. /dev is internal. */
export const LEGACY_FOOTER_ROUTES = ["/dev"] as const;

function matchesRoute(pathname: string, route: string): boolean {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * Pages that own the "Take your time." plate.
 * Listed routes opt in. /dev keeps the legacy footer.
 * Any other URL is the root 404, which also renders the plate.
 */
export function usesHomeFooterPlate(pathname: string): boolean {
  if (isAdminPath(pathname) || isMinimalChromePath(pathname)) return false;
  if (LEGACY_FOOTER_ROUTES.some((route) => matchesRoute(pathname, route))) {
    return false;
  }
  if (HOME_FOOTER_ROUTES.some((route) => matchesRoute(pathname, route))) {
    return true;
  }
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
  if (
    isStorePath(pathname) ||
    isStoriesPath(pathname) ||
    isCollectiblesPath(pathname) ||
    isScanPath(pathname)
  ) {
    return "solid";
  }
  return "full";
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
