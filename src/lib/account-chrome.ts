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
  if (user.initials?.trim()) return user.initials.trim();
  return user.email.slice(0, 2).toUpperCase();
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
