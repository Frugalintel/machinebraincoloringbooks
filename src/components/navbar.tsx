"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Scan,
  Search,
  ShoppingCart,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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
import {
  SHELL_FOCUS,
  SITE_NAV_LINKS,
  headerVariantFor,
  isNavLinkActive,
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
        className="container mx-auto flex h-16 items-center justify-between px-4 lg:h-20"
        aria-label="Minimal"
      >
        <HeaderLockups />
        <Link
          href="/"
          className={cn(
            "text-[13px] font-medium text-fg-secondary hover:text-cream",
            SHELL_FOCUS,
          )}
        >
          Home
        </Link>
      </nav>
    </header>
  );
}

function useAccountLinks(): MobileNavAccountLink[] {
  const { user, signOut, openAuthModal, isAdmin } = useAuth();
  return user
    ? [
        { name: "Profile and orders", href: "/profile/me" },
        ...(isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
        {
          name: "Sign out",
          onSelect: () => {
            void signOut();
          },
        },
      ]
    : [
        {
          name: "Sign in",
          onSelect: () => {
            openAuthModal("login");
          },
        },
        {
          name: "Register",
          onSelect: () => {
            openAuthModal("register");
          },
        },
        { name: "Order lookup", href: "/orders/lookup" },
      ];
}

/** Home and /auth: three links over the first plate; Menu below 761 px. */
function OverlayHeader() {
  const { setIsCartOpen, cartCount } = useCart();
  const { campaign } = useSettings();
  const pathname = usePathname();
  const accountLinks = useAccountLinks();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  return (
    <header
      data-site-chrome="overlay"
      className="relative z-20 pt-[env(safe-area-inset-top)]"
    >
      <CampaignBanner campaign={campaign} />
      <nav
        aria-label="Primary"
        className="absolute inset-x-0 top-full flex items-center justify-between px-10 py-7 max-[760px]:px-5 max-[760px]:py-5"
      >
        <BrandLockup
          layout="horizontal"
          wordmark="mono"
          markSize={24}
          ink="cream"
          className={cn("[&>span]:!gap-3", SHELL_FOCUS)}
          wordmarkClassName="text-[11px] tracking-[0.1em]"
        />
        <div className="flex items-center gap-9">
          <ul className="flex gap-9 text-[15px] leading-6 font-medium text-cream/66 max-[760px]:hidden">
            {overlayLinksFor(pathname).map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={cn("hover:text-cream", SHELL_FOCUS)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          {cartCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className={cn(
                "text-[15px] leading-6 font-medium text-cream",
                SHELL_FOCUS,
              )}
            >
              Cart {cartCount}
            </button>
          ) : null}
          <button
            ref={menuTriggerRef}
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-controls={menuId}
            onClick={() => setIsMobileMenuOpen(true)}
            className={cn(
              "hidden text-[15px] leading-6 font-medium text-cream max-[760px]:block",
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
        accountLinks={accountLinks}
      />
    </header>
  );
}

function FullHeader() {
  const { setIsCartOpen, cartCount } = useCart();
  const { user, signOut, openAuthModal, isAdmin } = useAuth();
  const { campaign } = useSettings();
  const pathname = usePathname();
  const accountLinks = useAccountLinks();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

            <div className="relative hidden md:block" ref={profileRef}>
              <button
                type="button"
                aria-label="Account"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                onClick={() => setIsProfileOpen((open) => !open)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center border border-line text-cream hover:border-cream",
                  SHELL_FOCUS,
                )}
              >
                {user ? (
                  <span className="text-sm font-semibold">{user.initials}</span>
                ) : (
                  <UserIcon size={18} strokeWidth={1.75} />
                )}
              </button>

              {isProfileOpen ? (
                <div
                  role="menu"
                  className="absolute top-12 right-0 z-50 flex w-56 flex-col border border-line bg-surface-1 shadow-2xl"
                >
                  {user ? (
                    <>
                      <div className="border-b border-line p-4">
                        <p className="font-semibold text-cream">
                          {user.initials}
                        </p>
                        <p className="font-label mt-1 truncate tracking-[0.08em] text-fg-muted">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile/me"
                        role="menuitem"
                        className={cn(
                          "px-4 py-3 text-sm font-medium text-fg-secondary hover:bg-surface-2 hover:text-cream",
                          SHELL_FOCUS,
                        )}
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Profile and orders
                      </Link>
                      {isAdmin ? (
                        <Link
                          href="/admin"
                          role="menuitem"
                          className={cn(
                            "border-t border-line px-4 py-3 text-sm font-medium text-fg-secondary hover:bg-surface-2 hover:text-cream",
                            SHELL_FOCUS,
                          )}
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Admin
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          void signOut();
                          setIsProfileOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 border-t border-line px-4 py-3 text-left text-sm font-medium text-danger hover:bg-danger-wash",
                          SHELL_FOCUS,
                        )}
                      >
                        <LogOut size={14} strokeWidth={1.75} />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          openAuthModal("login");
                          setIsProfileOpen(false);
                        }}
                        className={cn(
                          "w-full border-b border-line px-4 py-3 text-left text-sm font-semibold text-cream hover:bg-surface-2",
                          SHELL_FOCUS,
                        )}
                      >
                        Sign in
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          openAuthModal("register");
                          setIsProfileOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left text-sm font-medium text-fg-secondary hover:bg-surface-2 hover:text-cream",
                          SHELL_FOCUS,
                        )}
                      >
                        Register
                      </button>
                      <Link
                        href="/orders/lookup"
                        role="menuitem"
                        className={cn(
                          "border-t border-line px-4 py-3 text-sm font-medium text-fg-secondary hover:bg-surface-2 hover:text-cream",
                          SHELL_FOCUS,
                        )}
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Order lookup
                      </Link>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <Link
              href="/scan"
              aria-label="Scan"
              className={cn("p-2 text-fg-muted hover:text-cream", SHELL_FOCUS)}
            >
              <Scan size={20} strokeWidth={1.75} />
            </Link>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
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
              onClick={() => {
                setIsProfileOpen(false);
                setIsMobileMenuOpen(true);
              }}
              className={cn(
                "p-2 text-cream hover:text-fg-secondary lg:hidden",
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
        accountLinks={accountLinks}
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
      return <OverlayHeader />;
    case "full":
      return <FullHeader />;
    default: {
      const _exhaustive: never = variant;
      throw new Error(`Unhandled header variant: ${String(_exhaustive)}`);
    }
  }
}

export type { HeaderVariant };
