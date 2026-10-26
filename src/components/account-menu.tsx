"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  accountLabel,
  headerAccountLinks,
  signInHref,
  type AccountColumnLink,
  type AccountCueUser,
} from "@/lib/account-chrome";
import { SHELL_FOCUS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

const ITEM =
  "flex min-h-11 w-full items-center px-4 text-left text-sm font-medium text-fg-secondary hover:bg-surface-2 hover:text-cream";

export type HeaderAccountTone = "overlay" | "full";

export function HeaderAccount({ tone }: { tone: HeaderAccountTone }) {
  const pathname = usePathname();
  const { user, signOut, isAdmin, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (isLoading) {
    return (
      <span
        className={cn(
          "inline-flex h-10 items-center text-[13px] tracking-[0.12em] text-cream/40",
          tone === "overlay" && "text-[15px] leading-6",
        )}
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Loading account</span>
        <span aria-hidden="true">···</span>
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href={signInHref(pathname)}
        className={cn(
          "inline-flex shrink-0 items-center whitespace-nowrap text-cream hover:text-cream",
          SHELL_FOCUS,
          tone === "overlay"
            ? "h-10 text-[15px] leading-6 font-medium text-cream/66 hover:text-cream"
            : "h-10 px-1 text-[13px] font-medium",
        )}
      >
        Sign in
      </Link>
    );
  }

  const label = accountLabel(user);
  const links = headerAccountLinks(true, pathname);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        aria-label={`Account, ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center text-cream",
          SHELL_FOCUS,
          tone === "overlay"
            ? "h-10 max-w-[9rem] text-[15px] leading-6 font-medium text-cream/66 hover:text-cream max-[760px]:max-w-[4.5rem]"
            : "h-10 gap-2",
        )}
      >
        {tone === "full" ? (
          <span className="inline-flex h-10 w-10 items-center justify-center border border-line text-sm font-semibold">
            {user.initials || label.slice(0, 2)}
          </span>
        ) : null}
        <span
          className={cn(
            "truncate",
            tone === "full" &&
              "hidden max-w-[8rem] text-[13px] font-medium lg:inline",
          )}
        >
          {label}
        </span>
      </button>
      {open ? (
        <AccountPanel
          id={menuId}
          user={user}
          label={label}
          links={links}
          isAdmin={isAdmin}
          onClose={() => setOpen(false)}
          onSignOut={() => {
            setOpen(false);
            void signOut();
          }}
        />
      ) : null}
    </div>
  );
}

function AccountPanel({
  id,
  user,
  label,
  links,
  isAdmin,
  onClose,
  onSignOut,
}: {
  id: string;
  user: AccountCueUser;
  label: string;
  links: readonly AccountColumnLink[];
  isAdmin: boolean;
  onClose: () => void;
  onSignOut: () => void;
}) {
  return (
    <div
      id={id}
      role="menu"
      className="absolute top-full right-0 z-50 mt-2 flex w-56 flex-col border border-line bg-surface-1 shadow-2xl"
    >
      <div className="border-b border-line px-4 py-3">
        <p className="truncate font-medium text-cream">{label}</p>
        <p className="font-label mt-1 truncate tracking-[0.08em] text-fg-muted">
          {user.email}
        </p>
      </div>
      {links.map((link) =>
        link.action === "sign-out" ? (
          <button
            key={link.name}
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className={cn(
              ITEM,
              "gap-2 border-t border-line text-danger hover:bg-danger-wash hover:text-danger",
              SHELL_FOCUS,
            )}
          >
            <LogOut size={14} strokeWidth={1.75} />
            {link.name}
          </button>
        ) : (
          <Link
            key={link.name}
            href={link.href ?? "/profile/me"}
            role="menuitem"
            className={cn(ITEM, SHELL_FOCUS)}
            onClick={onClose}
          >
            {link.name}
          </Link>
        ),
      )}
      {isAdmin ? (
        <Link
          href="/admin"
          role="menuitem"
          className={cn(ITEM, "border-t border-line", SHELL_FOCUS)}
          onClick={onClose}
        >
          Admin
        </Link>
      ) : null}
    </div>
  );
}
