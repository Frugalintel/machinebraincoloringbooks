"use client";

import Link from "next/link";
import { useOptionalAuth } from "@/context/auth-context";
import { useBrowserPathname } from "@/lib/use-browser-pathname";
import {
  accountColumnLinks,
  type AccountColumnLink,
} from "@/lib/account-chrome";
import { SHELL_FOCUS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export function AccountFooterLinks({ variant }: { variant: "home" | "site" }) {
  const pathname = useBrowserPathname();
  const { user, signOut } = useOptionalAuth();
  const links = accountColumnLinks(Boolean(user), variant, pathname);

  return (
    <nav aria-label="Account">
      {variant === "site" ? (
        <h2 className="font-label mb-5 tracking-[0.12em] text-cream">
          Account
        </h2>
      ) : (
        <p className="h mono">Account</p>
      )}
      <ul className={variant === "site" ? "space-y-3" : undefined}>
        {links.map((link) => (
          <li key={link.name}>
            <AccountFooterItem
              link={link}
              variant={variant}
              onSignOut={() => {
                void signOut();
              }}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AccountFooterItem({
  link,
  variant,
  onSignOut,
}: {
  link: AccountColumnLink;
  variant: "home" | "site";
  onSignOut: () => void;
}) {
  const siteClass = cn(
    "hit-44 text-sm font-medium text-fg-muted hover:text-cream",
    SHELL_FOCUS,
  );

  if (link.action === "sign-out") {
    return (
      <button
        type="button"
        onClick={onSignOut}
        className={variant === "site" ? siteClass : undefined}
      >
        {link.name}
      </button>
    );
  }

  return (
    <Link
      href={link.href ?? "/auth?mode=login"}
      className={variant === "site" ? siteClass : undefined}
    >
      {link.name}
    </Link>
  );
}
