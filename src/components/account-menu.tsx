"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  accountCue,
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

export function HeaderAccount({
  tone,
  tight = false,
}: {
  tone: HeaderAccountTone;
  /** Filled cart on a narrow header. The visible cue shortens so the gaps hold. */
  tight?: boolean;
}) {
  const pathname = usePathname();
  const { user, signOut, isAdmin, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const panel = menuRef.current;
    const items = () =>
      Array.from(panel.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    items()[0]?.focus();

    const onPointer = (event: MouseEvent) => {
      if (!panel.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      const list = items();
      const index = list.indexOf(document.activeElement as HTMLElement);
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list.length === 0) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next =
          index < 0
            ? step === 1
              ? 0
              : list.length - 1
            : (index + step + list.length) % list.length;
        list[next]?.focus();
        return;
      }
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const target = event.key === "Home" ? list[0] : list[list.length - 1];
        target?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [closeMenu, open]);

  if (isLoading) {
    return (
      <span
        className={cn(
          "inline-flex h-11 min-w-11 items-center text-[13px] tracking-[0.12em] text-cream/40",
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
            ? "h-11 text-[15px] leading-6 font-medium text-cream/66 hover:text-cream"
            : "h-11 px-1 text-[13px] font-medium",
        )}
      >
        Sign in
      </Link>
    );
  }

  const label = accountLabel(user);
  const shown = tone === "overlay" ? accountCue(label, tight) : label;
  const links = headerAccountLinks(true, pathname);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        aria-label={label === "Account" ? "Account" : `Account, ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        ref={triggerRef}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center text-cream",
          SHELL_FOCUS,
          tone === "overlay"
            ? "h-11 max-w-[9rem] text-[15px] leading-6 font-medium text-cream/66 hover:text-cream max-[760px]:max-w-[4.5rem]"
            : "h-11 gap-2",
          tone === "overlay" &&
            (tight
              ? "max-[400px]:max-w-[3rem]"
              : "max-[400px]:max-w-[4.25rem]"),
        )}
      >
        {tone === "full" ? (
          <span className="inline-flex h-11 w-11 items-center justify-center border border-line text-sm font-semibold">
            {user.initials || label.slice(0, 2)}
          </span>
        ) : null}
        <span
          className={cn(
            "min-w-0 truncate",
            tone === "full" &&
              "hidden max-w-[8rem] text-[13px] font-medium lg:inline",
          )}
        >
          {shown}
        </span>
      </button>
      {open ? (
        <AccountPanel
          id={menuId}
          user={user}
          label={label}
          links={links}
          isAdmin={isAdmin}
          onClose={() => closeMenu(false)}
          onSignOut={() => {
            closeMenu(false);
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
        <p className="mt-1 truncate font-sans text-sm normal-case tracking-normal text-fg-muted">
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
            className={cn(ITEM, "gap-2 border-t border-line", SHELL_FOCUS)}
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
