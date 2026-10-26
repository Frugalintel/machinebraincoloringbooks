"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scan, Search, ShoppingCart } from "lucide-react";
import { useId, useRef, useState } from "react";
import { HeaderAccount } from "@/components/account-menu";
import { CampaignBanner } from "@/components/campaign-banner";
import { BrandLockup } from "@/components/mark";
import { MobileNav, type MobileNavAccountLink } from "@/components/mobile-nav";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import {
  HEADER_MARK_SIZE_DESKTOP_PX,
  HEADER_MARK_SIZE_MOBILE_PX,
} from "@/lib/mark";
import { accountLabel, headerAccountLinks } from "@/lib/account-chrome";
import {
  SHELL_FOCUS,
  SITE_NAV_LINKS,
  cartLabel,
  headerVariantFor,
  isNavLinkActive,
  isOverlayLinkCurrent,
  overlayLinksFor,
  type HeaderVariant,
} from "@/lib/site-shell";
import { cn } from "@/lib/utils";

const WORDMARK_CLASS = "text-[11px] leading-none";

/** Stacked lockup: S3 small cut below `lg`, full mark-v6 at 48 px from `lg`. */
function HeaderLockups() {
  return (
    <>
      <BrandLockup
        layout="stacked"
        wordmark="mono"
        markSize={HEADER_MARK_SIZE_MOBILE_PX}
        ink="cream"
        className="lg:hidden"
        wordmarkClassName={WORDMARK_CLASS}
      />
      <BrandLockup
        layout="stacked"
        wordmark="mono"
        markSize={HEADER_MARK_SIZE_DESKTOP_PX}
        ink="cream"
        className="hidden lg:inline-flex"
        wordmarkClassName={WORDMARK_CLASS}
      />
    </>
  );
}

function MinimalHeader() {
  return (
    <header
      data-site-chrome="minimal"
      className="sticky top-0 z-[10000] border-b border-line bg-background pt-[env(safe-area-inset-top)]"
      style={{ backgroundColor: "var(--base)" }}
    >
      <nav
        className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:h-20"
        aria-label="Minimal"
      >
        <HeaderLockups />
        <div className="flex shrink-0 items-center gap-5">
          <HeaderAccount tone="full" />
          <Link
            href="/"
            className={cn(
              "text-[13px] font-medium text-fg-secondary hover:text-cream",
              SHELL_FOCUS,
            )}
          >
            Home
          </Link>
        </div>
      </nav>
    </header>
  );
}

function useAccountLinks(): {
  links: MobileNavAccountLink[];
  cue?: string;
  pending: boolean;
} {
  const pathname = usePathname();
  const { user, signOut, isAdmin, isLoading } = useAuth();
  if (isLoading) {
    return { links: [], pending: true };
  }
  const links = headerAccountLinks(Boolean(user), pathname).map(
    (link): MobileNavAccountLink =>
      link.action === "sign-out"
        ? {
            name: link.name,
            onSelect: () => {
              void signOut();
            },
          }
        : {
            name: link.name,
            href: link.href,
            tone: link.name === "Sign in" ? "primary" : undefined,
          },
  );
  if (isAdmin && user) {
    links.splice(links.length - 1, 0, { name: "Admin", href: "/admin" });
  }
  return {
    links,
    pending: false,
    cue: user ? accountLabel(user) : undefined,
  };
}

const HOME_NAV_TEXT = "text-[15px] leading-6 font-medium";

/**
 * `overlay` sits on the first plate of home and /auth and shows Cart once it has items.
 * `solid` is the store's sticky bar: Cart and account always reachable.
 */
function HomeNavHeader({ solid }: { solid: boolean }) {
  const { setIsCartOpen, cartCount } = useCart();
  const { campaign } = useSettings();
  const pathname = usePathname();
  const account = useAccountLinks();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const links = overlayLinksFor(pathname);

  return (
    <header
      data-site-chrome={solid ? "solid" : "overlay"}
      className={cn(
        "pt-[env(safe-area-inset-top)]",
        solid
          ? "sticky top-0 z-[10000] border-b border-line bg-background"
          : "relative z-20",
      )}
    >
      <CampaignBanner campaign={campaign} />
      <nav
        aria-label="Primary"
        className={cn(
          "flex items-center justify-between",
          solid
            ? "h-16 px-10 max-[760px]:px-5"
            : "absolute inset-x-0 top-full px-10 py-[26px] max-[760px]:px-5 max-[760px]:py-[18px]",
        )}
      >
        <BrandLockup
          layout="horizontal"
          wordmark="mono"
          markSize={24}
          ink="cream"
          className={cn("[&>span]:!gap-3", SHELL_FOCUS)}
          wordmarkClassName="text-[11px] tracking-[0.1em]"
        />
        <div className="flex min-w-0 items-center gap-9 max-[760px]:gap-4">
          <ul
            className={cn(
              HOME_NAV_TEXT,
              "flex gap-9 text-cream/66 max-[760px]:hidden",
            )}
          >
            {links.map((link) => {
              const current = solid && isOverlayLinkCurrent(pathname, link);
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "hover:text-cream",
                      current && "text-cream",
                      SHELL_FOCUS,
                    )}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <HeaderAccount tone="overlay" />
          {solid || cartCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={cartLabel(cartCount)}
              data-filled={cartCount > 0 ? "" : undefined}
              className={cn(
                HOME_NAV_TEXT,
                "inline-flex min-h-11 items-center justify-center bg-transparent text-cream",
                SHELL_FOCUS,
              )}
            >
              <span
                className={cn(
                  cartCount > 0 &&
                    "inline-flex h-8 items-center gap-2 bg-cream px-3 text-ink",
                )}
              >
                Cart
                {cartCount > 0 ? (
                  <span className="tabular-nums">{cartCount}</span>
                ) : null}
              </span>
            </button>
          ) : null}
          <button
            ref={menuTriggerRef}
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-controls={menuId}
            onClick={() => setIsMobileMenuOpen(true)}
            className={cn(
              HOME_NAV_TEXT,
              "relative hidden min-h-11 items-center text-cream max-[760px]:inline-flex",
              "before:absolute before:-inset-x-0.5 before:inset-y-0 before:content-['']",
              SHELL_FOCUS,
            )}
          >
            Menu
          </button>
        </div>
      </nav>
      <MobileNav
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuId={menuId}
        triggerRef={menuTriggerRef}
        pathname={pathname}
        accountLinks={account.links}
        accountCue={account.cue}
        accountPending={account.pending}
        links={links}
      />
    </header>
  );
}

function FullHeader() {
  const { setIsCartOpen, cartCount } = useCart();
  const { campaign } = useSettings();
  const pathname = usePathname();
  const account = useAccountLinks();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  return (
    <header
      data-site-chrome="full"
      className="sticky top-0 z-[10000] bg-background pt-[env(safe-area-inset-top)]"
      style={{ backgroundColor: "var(--base)" }}
    >
      <CampaignBanner campaign={campaign} />

      <nav
        className="border-b border-line bg-background"
        style={{ backgroundColor: "var(--base)" }}
        aria-label="Primary"
      >
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-8 md:gap-12">
            <HeaderLockups />

            <div className="hidden items-center gap-7 lg:flex">
              {SITE_NAV_LINKS.map((link) => {
                const active = isNavLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-[13px] font-medium hover:text-cream",
                      SHELL_FOCUS,
                      active
                        ? "border-b border-cream pb-1 text-cream"
                        : "text-fg-muted",
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Search"
              className={cn(
                "hidden h-10 items-center gap-2 px-3 text-[13px] font-medium text-fg-muted hover:text-cream md:inline-flex",
                SHELL_FOCUS,
              )}
            >
              <Search size={15} strokeWidth={1.75} />
              <span>Search</span>
            </button>

            <HeaderAccount tone="full" />

            <Link
              href="/scan"
              aria-label="Scan"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center text-fg-muted hover:text-cream",
                SHELL_FOCUS,
              )}
            >
              <Scan size={20} strokeWidth={1.75} />
            </Link>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={cartLabel(cartCount)}
              className={cn(
                "relative inline-flex h-10 items-center gap-2 border border-line-strong px-3 text-[14px] font-semibold text-cream hover:bg-cream hover:text-ink",
                SHELL_FOCUS,
              )}
            >
              <span className="hidden md:inline">Cart</span>
              <ShoppingCart size={16} strokeWidth={1.75} />
              {cartCount > 0 ? (
                <span className="font-label text-signal tracking-[0.08em]">
                  {cartCount}
                </span>
              ) : null}
            </button>

            <button
              ref={menuTriggerRef}
              type="button"
              aria-label="Menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls={menuId}
              onClick={() => setIsMobileMenuOpen(true)}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center text-cream hover:text-fg-secondary lg:hidden",
                SHELL_FOCUS,
              )}
            >
              <span className="sr-only">Menu</span>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <MobileNav
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuId={menuId}
        triggerRef={menuTriggerRef}
        pathname={pathname}
        accountLinks={account.links}
        accountCue={account.cue}
        accountPending={account.pending}
      />
    </header>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const variant = headerVariantFor(pathname);

  switch (variant) {
    case "hidden":
      return null;
    case "minimal":
      return <MinimalHeader />;
    case "overlay":
      return <HomeNavHeader solid={false} />;
    case "solid":
      return <HomeNavHeader solid />;
    case "full":
      return <FullHeader />;
    default: {
      const _exhaustive: never = variant;
      throw new Error(`Unhandled header variant: ${String(_exhaustive)}`);
    }
  }
}

export type { HeaderVariant };
