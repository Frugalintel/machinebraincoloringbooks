"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

const footerLinks = {
  Shop: [
    { name: "Store", href: "/store" },
    { name: "Stories", href: "/stories" },
    { name: "Collectibles", href: "/collectibles" },
    { name: "About", href: "/about" },
  ],
  Account: [
    { name: "Login", href: "/auth?mode=login" },
    { name: "Register", href: "/auth?mode=register" },
    { name: "Order Lookup", href: "/orders/lookup" },
    { name: "Help", href: "/help" },
  ],
  Legal: [
    { name: "Terms", href: "/terms" },
    { name: "Privacy", href: "/privacy" },
    { name: "Licenses", href: "/licenses" },
  ],
};

export function Footer() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/review") ||
    pathname === "/scan"
  ) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-line bg-background text-fg-muted font-sans">
      {/* Top Grid */}
      <div className="container mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="mb-4 whitespace-nowrap font-heading font-bold text-[16px] md:text-[18px] uppercase tracking-[0.02em] text-cream">
              Machine <span className="text-primary">Brain</span>
            </p>
            <p className="font-label max-w-[200px] leading-relaxed tracking-[0.08em]">
              Coloring books with secrets. Est. 2025.
            </p>
          </div>
          <div className="mt-8 md:mt-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
              <div className="w-2 h-2 bg-primary animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Links Columns */}
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category}>
            <h4 className="font-label mb-6 inline-block border-b border-line pb-2 tracking-[0.12em] text-cream">
              {category}
            </h4>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm font-normal uppercase tracking-[0.02em] hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-line bg-background">
        <div className="container mx-auto px-4 md:px-6 h-12 flex items-center justify-between font-label tracking-[0.08em]">
          <span>© 2025 Machine Brain Inc.</span>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:text-cream transition-colors group"
          >
            Return to Top
            <ArrowUp
              size={12}
              className="group-hover:-translate-y-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
