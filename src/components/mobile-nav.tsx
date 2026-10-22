"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import { BrandLockup } from "@/components/mark";
import { HEADER_MARK_SIZE_MOBILE_PX } from "@/lib/mark";
import { SHELL_FOCUS, SITE_NAV_LINKS, isNavLinkActive } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type MobileNavAccountLink = {
  name: string;
  href?: string;
  onSelect?: () => void;
};

export function MobileNav({
  open,
  onClose,
  menuId,
  triggerRef,
  pathname,
  accountLinks,
}: {
  open: boolean;
  onClose: () => void;
  menuId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  pathname: string;
  accountLinks: readonly MobileNavAccountLink[];
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (nodes.length === 0) {
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const trigger = triggerRef.current;
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Dismiss menu"
        className="site-mobile-backdrop fixed inset-0 z-[10001] bg-background"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="site-mobile-nav fixed inset-y-0 right-0 z-[10002] flex w-[min(100%,20rem)] flex-col border-l border-line bg-background pt-[env(safe-area-inset-top)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <BrandLockup
            layout="horizontal"
            markSize={HEADER_MARK_SIZE_MOBILE_PX}
            ink="cream"
            wordmarkClassName="text-[16px]"
          />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={cn(
              "p-2 text-cream hover:text-fg-secondary",
              SHELL_FOCUS,
            )}
          >
            <X size={22} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 py-6">
          <div>
            <p className="font-label mb-4 text-signal tracking-[0.1em]">Menu</p>
            <ul className="flex flex-col gap-1">
              {SITE_NAV_LINKS.map((link, index) => {
                const active = isNavLinkActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-baseline gap-3 py-2 text-[17px] font-medium",
                        SHELL_FOCUS,
                        active
                          ? "text-cream"
                          : "text-fg-secondary hover:text-cream",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="font-label w-6 text-signal tracking-[0.08em]"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="font-label mb-4 text-fg-muted tracking-[0.1em]">
              Account
            </p>
            <ul className="flex flex-col gap-1">
              {accountLinks.map((item) => (
                <li key={item.name}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "block py-2 text-[16px] font-medium text-fg-secondary hover:text-cream",
                        SHELL_FOCUS,
                      )}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        item.onSelect?.();
                        onClose();
                      }}
                      className={cn(
                        "block w-full py-2 text-left text-[16px] font-medium text-fg-secondary hover:text-cream",
                        SHELL_FOCUS,
                      )}
                    >
                      {item.name}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
