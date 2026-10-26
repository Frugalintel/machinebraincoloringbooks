/**
 * Signed-in vs signed-out chrome shared by header and both footers.
 * Guest copy stays the existing Sign in / Register (or Create account) links.
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

export function accountColumnLinks(
  signedIn: boolean,
  variant: "home" | "site",
): AccountColumnLink[] {
  if (signedIn) {
    const links: AccountColumnLink[] = [
      { name: "Profile and orders", href: "/profile/me" },
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
      { name: "Sign in", href: "/auth?mode=login" },
      { name: "Create account", href: "/auth?mode=register" },
      { name: "Order lookup", href: "/orders/lookup" },
    ];
  }

  return [
    { name: "Sign in", href: "/auth?mode=login" },
    { name: "Register", href: "/auth?mode=register" },
    { name: "Order lookup", href: "/orders/lookup" },
    { name: "Help", href: "/help" },
  ];
}
