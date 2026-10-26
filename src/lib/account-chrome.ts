/**
 * Signed-in vs signed-out chrome shared by header and both footers.
 * Guest copy is Sign in / Create account.
 */

export type AccountColumnLink = {
  name: string;
  href?: string;
  action?: "sign-out";
};

export type AccountCueUser = {
  email: string;
  initials?: string;
  displayName?: string;
};

export function accountLabel(user: AccountCueUser | null | undefined): string {
  if (!user) return "Sign in";
  const named = user.displayName?.trim();
  if (named) return named;
  return "Account";
}

/**
 * The filled cart at ≤400px only has room for a short cue.
 * A full name stays available in the accessible name.
 */
export function accountCue(label: string, tight: boolean): string {
  if (!tight) return label;
  if (label === "Account") return "You";
  const first = label.trim().split(/\s+/)[0];
  return first || label;
}

/** Full-page sign-in. `next` returns the reader to the page they were on. */
export function signInHref(pathname: string): string {
  if (!pathname || pathname === "/auth" || pathname.startsWith("/auth/")) {
    return "/auth?mode=login";
  }
  return `/auth?mode=login&next=${encodeURIComponent(pathname)}`;
}

export function registerHref(pathname: string): string {
  if (!pathname || pathname === "/auth" || pathname.startsWith("/auth/")) {
    return "/auth?mode=register";
  }
  return `/auth?mode=register&next=${encodeURIComponent(pathname)}`;
}

export const PROFILE_HREF = "/profile/me";
export const ORDERS_HREF = "/profile/me#orders";

/** Header and mobile-menu account rows. Signed-out Sign in is always a link. */
export function headerAccountLinks(
  signedIn: boolean,
  pathname: string,
): AccountColumnLink[] {
  if (signedIn) {
    return [
      { name: "Profile", href: PROFILE_HREF },
      { name: "Orders", href: ORDERS_HREF },
      { name: "Sign out", action: "sign-out" },
    ];
  }
  return [
    { name: "Sign in", href: signInHref(pathname) },
    { name: "Create account", href: registerHref(pathname) },
    { name: "Order lookup", href: "/orders/lookup" },
  ];
}

export function accountColumnLinks(
  signedIn: boolean,
  variant: "home" | "site",
  pathname = "",
): AccountColumnLink[] {
  const signIn = pathname ? signInHref(pathname) : "/auth?mode=login";
  const createAccount = pathname
    ? registerHref(pathname)
    : "/auth?mode=register";

  if (signedIn) {
    const links: AccountColumnLink[] = [
      { name: "Profile", href: PROFILE_HREF },
      { name: "Orders", href: ORDERS_HREF },
      { name: "Sign out", action: "sign-out" },
      { name: "Order lookup", href: "/orders/lookup" },
    ];
    if (variant === "site") {
      links.push({ name: "Help", href: "/help" });
    }
    return links;
  }

  if (variant === "home") {
    return [
      { name: "Sign in", href: signIn },
      { name: "Create account", href: createAccount },
      { name: "Order lookup", href: "/orders/lookup" },
    ];
  }

  return [
    { name: "Sign in", href: signIn },
    { name: "Create account", href: createAccount },
    { name: "Order lookup", href: "/orders/lookup" },
    { name: "Help", href: "/help" },
  ];
}
