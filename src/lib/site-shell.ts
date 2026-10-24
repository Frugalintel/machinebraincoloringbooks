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

/** "overlay": home and /auth draw the nav over their first plate and own their footer. */
export type HeaderVariant = "full" | "overlay" | "minimal" | "hidden";

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

/** Over-plate nav links. Home keeps R-E2's Worlds; /auth (Studio S3) has Stories. */
export const HOME_OVERLAY_LINKS: readonly SiteLink[] = [
  { name: "Books", href: "/store" },
  { name: "Worlds", href: "/store" },
  { name: "About", href: "/about" },
];

export const AUTH_OVERLAY_LINKS: readonly SiteLink[] = [
  { name: "Books", href: "/store" },
  { name: "Stories", href: "/stories" },
  { name: "About", href: "/about" },
];

export function overlayLinksFor(pathname: string): readonly SiteLink[] {
  return pathname === "/auth" ? AUTH_OVERLAY_LINKS : HOME_OVERLAY_LINKS;
}

export function isMinimalChromePath(pathname: string): boolean {
  return (
    pathname.startsWith("/auth/") ||
    pathname === "/scan" ||
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
  return "full";
}

export function hidesCustomerFooter(pathname: string): boolean {
  return headerVariantFor(pathname) !== "full";
}

export function isNavLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Visible focus ring for shell controls. Signal is the locked focus token. */
export const SHELL_FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";
