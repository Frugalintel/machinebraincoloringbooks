"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";

const footerLinks = {
  "Sectors": [
      { name: "Store", href: "/store" },
      { name: "Stories", href: "/stories" },
      { name: "Collectibles", href: "/collectibles" },
      { name: "About", href: "/about" }
  ],
  "System": [
      { name: "Login", href: "/auth?mode=login" },
      { name: "Register", href: "/auth?mode=register" },
      { name: "Order Lookup", href: "/orders/lookup" },
      { name: "Help", href: "/help" }
  ],
  "Legal": [
      { name: "Terms", href: "/terms" },
      { name: "Privacy", href: "/privacy" },
      { name: "Licenses", href: "/licenses" }
  ]
};

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[#333] bg-[#0a0a0a] text-gray-500 font-sans">
      {/* Top Grid */}
      <div className="container mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Column */}
        <div className="flex flex-col justify-between">
            <div>
                <h3 className="font-heading text-2xl text-white uppercase tracking-tighter mb-4">
                    Machine<br/><span className="text-primary">Brain</span>
                </h3>
                <p className="text-xs font-mono uppercase tracking-widest leading-relaxed max-w-[200px]">
                    Analog artifacts for the digital consciousness. Est. 2025.
                </p>
            </div>
            <div className="mt-8 md:mt-0">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                    <div className="w-2 h-2 bg-primary animate-pulse rounded-full"></div>
                    System Operational
                </div>
            </div>
        </div>

        {/* Links Columns */}
        {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
                <h4 className="text-xs font-mono text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2 inline-block">
                    {category}
                </h4>
                <ul className="space-y-3">
                    {links.map((link) => (
                        <li key={link.name}>
                            <Link href={link.href} className="text-sm hover:text-primary transition-colors uppercase tracking-wide">
                                {link.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#333] bg-[#111]">
          <div className="container mx-auto px-4 md:px-6 h-12 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
              <span>© 2025 Machine Brain Inc.</span>
              
              <button 
                onClick={scrollToTop}
                className="flex items-center gap-2 hover:text-white transition-colors group"
              >
                  Return to Top 
                  <ArrowUp size={12} className="group-hover:-translate-y-1 transition-transform" />
              </button>
          </div>
      </div>
    </footer>
  );
}
