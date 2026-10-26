"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { AccountFooterLinks } from "@/components/account-footer-links";
import { BrandLockup } from "@/components/mark";
import {
  FOOTER_LINK_GROUPS,
  SHELL_FOCUS,
  SITE_SOCIAL_LINKS,
  hidesCustomerFooter,
} from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export function Footer() {
  const pathname = usePathname();

  if (hidesCustomerFooter(pathname)) {
    return null;
  }

  const year = new Date().getFullYear();

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <footer className="site-footer border-t border-line bg-background text-fg-muted font-sans">
      <div className="container mx-auto grid grid-cols-1 gap-12 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="flex flex-col justify-between">
          <div>
            <BrandLockup
              layout="horizontal"
              markSize={48}
              ink="cream"
              className="mb-4"
              wordmarkClassName="text-[16px] md:text-[18px]"
            />
          </div>
        </div>

        {FOOTER_LINK_GROUPS.map((group) =>
          group.heading === "Account" ? (
            <AccountFooterLinks key={group.heading} variant="site" />
          ) : (
            <div key={group.heading}>
              <h2 className="font-label mb-5 tracking-[0.12em] text-cream">
                {group.heading}
              </h2>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-sm font-medium text-fg-muted hover:text-cream",
                        SHELL_FOCUS,
                      )}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </div>

      {SITE_SOCIAL_LINKS.length > 0 ? (
        <div className="border-t border-line">
          <div className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-4 md:px-6">
            <p className="font-label tracking-[0.12em] text-cream">Social</p>
            {SITE_SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                rel="noreferrer"
                target="_blank"
                className={cn(
                  "text-sm font-medium text-fg-muted hover:text-cream",
                  SHELL_FOCUS,
                )}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-t border-line bg-background">
        <div className="container mx-auto flex min-h-12 flex-col items-start justify-between gap-3 px-4 py-3 font-sans md:flex-row md:items-center md:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-label tracking-[0.08em]">
              © {year} Machine Brain
            </span>
            <Link
              href="/terms"
              className={cn(
                "font-medium text-fg-muted hover:text-cream",
                SHELL_FOCUS,
              )}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className={cn(
                "font-medium text-fg-muted hover:text-cream",
                SHELL_FOCUS,
              )}
            >
              Privacy
            </Link>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-cream",
              SHELL_FOCUS,
            )}
          >
            Back to top
            <ArrowUp size={12} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </footer>
  );
}
