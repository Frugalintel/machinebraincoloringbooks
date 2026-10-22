"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  Shield,
  Scan,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useSettings } from "@/context/settings-context";

const navLinks = [
  { name: "Store", href: "/store" },
  { name: "Stories", href: "/stories" },
  { name: "Collectibles", href: "/collectibles" },
  { name: "About", href: "/about" },
];

export function Navbar() {
  const { setIsCartOpen, cartCount } = useCart();
  const { user, signOut, openAuthModal, isAdmin } = useAuth();
  const { campaign } = useSettings();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Check if we should hide the navbar
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/review") ||
    pathname === "/scan"
  ) {
    return null;
  }

  // Determine if banner should show
  const showBanner = campaign.isActive && campaign.banner.enabled;
  const theme = campaign.theme || { animation: "none" };
  const bannerStyle = campaign.banner.customCss
    ? undefined
    : {
        backgroundColor: campaign.banner.backgroundColor || "#e63946",
        color: campaign.banner.textColor || "#ffffff",
      };

  return (
    <>
      {/* Safe Area Mask (Fixed) - Must be above body::before texture overlay (z-9999) */}
      <div
        className="fixed top-0 left-0 right-0 bg-background z-[10001] pointer-events-none"
        style={{
          backgroundColor: "var(--base)",
          height: "calc(env(safe-area-inset-top) + 1px)",
          transform: "translateZ(0)",
        }}
      />

      {/* Safe Area Spacer (Scrolls) */}
      <div
        className="h-[env(safe-area-inset-top)] w-full bg-background"
        style={{ backgroundColor: "var(--base)" }}
      />

      {/* Global Discount Banner */}
      {showBanner ? (
        <Link
          href={campaign.banner.link || "/store"}
          className={`block w-full transition-colors z-[10000] relative overflow-hidden group ${
            theme.animation === "pulse" ? "animate-pulse" : ""
          } ${campaign.banner.pattern ? `pattern-${campaign.banner.pattern}` : ""}`}
          style={{
            ...bannerStyle,
            backgroundImage: campaign.banner.backgroundImage
              ? `url(${campaign.banner.backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Animation & Pattern Styles */}
          <style jsx>{`
            @keyframes marquee {
              0% {
                transform: translateX(100%);
              }
              100% {
                transform: translateX(-100%);
              }
            }
            @keyframes glitch {
              0% {
                transform: translate(0);
              }
              20% {
                transform: translate(-2px, 2px);
              }
              40% {
                transform: translate(-2px, -2px);
              }
              60% {
                transform: translate(2px, 2px);
              }
              80% {
                transform: translate(2px, -2px);
              }
              100% {
                transform: translate(0);
              }
            }
            .animate-marquee {
              animation: marquee 15s linear infinite;
              white-space: nowrap;
              display: inline-block;
              min-width: 100%;
            }
            .animate-glitch {
              animation: glitch 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)
                infinite;
            }
            /* Patterns */
            .pattern-caution {
              background-image: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(0, 0, 0, 0.1) 10px,
                rgba(0, 0, 0, 0.1) 20px
              );
            }
            .pattern-grid {
              background-image:
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(
                  90deg,
                  rgba(255, 255, 255, 0.1) 1px,
                  transparent 1px
                );
              background-size: 10px 10px;
            }
            .pattern-dots {
              background-image: radial-gradient(
                rgba(255, 255, 255, 0.2) 1px,
                transparent 1px
              );
              background-size: 8px 8px;
            }
            .pattern-gradient {
              background-image: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
              );
            }
            .custom-banner {
              ${campaign.banner.customCss || ""}
            }
          `}</style>

          {/* Overlay for readability if image is used */}
          {campaign.banner.backgroundImage ? (
            <div className="absolute inset-0 bg-background/40 -z-10"></div>
          ) : null}

          <div
            className={`container mx-auto px-4 h-8 flex items-center justify-center gap-2 text-[10px] md:text-xs font-mono uppercase tracking-widest ${campaign.banner.customCss ? "custom-banner" : ""}`}
          >
            <div
              className={
                theme.animation === "marquee"
                  ? "animate-marquee w-full text-center"
                  : theme.animation === "glitch"
                    ? "animate-glitch"
                    : ""
              }
            >
              <span className="font-bold">{campaign.banner.text}</span>
              <span className="hidden md:inline group-hover:underline ml-2 opacity-80">
                Check it out &rarr;
              </span>
            </div>
          </div>
        </Link>
      ) : null}

      <nav
        className="w-full border-b border-line bg-background z-[10000] sticky top-[env(safe-area-inset-top)] isolate"
        style={{
          backgroundColor: "var(--base)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-8 md:gap-12">
            <Link
              href="/"
              className="flex flex-col leading-none tracking-tighter group"
            >
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-4xl font-display font-bold text-cream uppercase group-hover:text-primary transition-colors">
                  Machine Brain
                </h1>
                <div className="w-2 h-2 md:w-3 md:h-3 bg-primary mt-1 group-hover:bg-cream transition-colors"></div>
              </div>
              <span className="text-[10px] md:text-sm text-fg-muted uppercase tracking-[0.2em] font-sans">
                Coloring Books
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-mono uppercase tracking-widest hover:text-primary transition-colors ${
                    pathname.startsWith(link.href)
                      ? "text-cream border-b-2 border-primary pb-1"
                      : "text-fg-muted"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Actions Area */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <div className="hidden md:flex items-center">
              <div className="bg-surface-2 h-10 flex items-center px-4 gap-3 text-fg-muted font-bold uppercase tracking-wider hover:bg-cream hover:text-ink transition-colors cursor-pointer border border-line">
                <span className="text-xs">Search</span>
                <Search size={14} strokeWidth={3} />
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative hidden md:block" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center justify-center w-10 h-10 border border-line transition-colors ${isProfileOpen || user ? "bg-primary text-ink border-primary hover:bg-cream" : "hover:bg-primary hover:border-primary hover:text-ink text-cream"}`}
              >
                {user ? (
                  <span className="font-display font-bold text-sm tracking-wide">
                    {user.initials}
                  </span>
                ) : (
                  <UserIcon size={18} />
                )}
              </button>

              <AnimatePresence>
                {isProfileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-12 right-0 w-56 bg-background border border-line shadow-2xl z-50 flex flex-col"
                  >
                    <div className="h-1 w-full bg-primary"></div>
                    {user ? (
                      <>
                        <div className="p-4 border-b border-line">
                          <p className="text-cream font-display uppercase">
                            {user.initials}
                          </p>
                          <p className="text-[10px] text-fg-muted font-mono truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/profile/me"
                          className="px-4 py-3 text-sm text-fg-muted hover:text-cream hover:bg-background flex items-center gap-3 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <UserIcon size={14} /> My Profile & Orders
                        </Link>
                        {isAdmin ? (
                          <Link
                            href="/admin"
                            className="px-4 py-3 text-sm text-primary hover:text-cream hover:bg-primary/10 flex items-center gap-3 transition-colors border-t border-line"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Shield size={14} /> Admin Panel
                          </Link>
                        ) : null}
                        <button
                          onClick={() => {
                            signOut();
                            setIsProfileOpen(false);
                          }}
                          className="px-4 py-3 text-sm text-danger hover:bg-danger-wash hover:text-danger flex items-center gap-3 transition-colors text-left w-full border-t border-line"
                        >
                          <LogOut size={14} /> Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            openAuthModal("login");
                            setIsProfileOpen(false);
                          }}
                          className="px-4 py-3 text-sm text-cream hover:bg-background flex items-center gap-3 transition-colors border-b border-line w-full text-left"
                        >
                          <LogIn size={14} className="text-primary" />
                          <span className="font-display uppercase tracking-wider">
                            Login
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            openAuthModal("register");
                            setIsProfileOpen(false);
                          }}
                          className="px-4 py-3 text-sm text-fg-muted hover:text-cream hover:bg-background flex items-center gap-3 transition-colors w-full text-left"
                        >
                          <UserPlus size={14} /> Register
                        </button>
                        <Link
                          href="/orders/lookup"
                          className="px-4 py-3 text-sm text-fg-muted hover:text-cream hover:bg-background flex items-center gap-3 transition-colors border-t border-line"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Search size={14} /> Order Lookup
                        </Link>
                      </>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Cart Trigger */}
            <Link
              href="/scan"
              className="text-fg-muted hover:text-cream transition-colors"
            >
              <Scan size={20} />
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-primary h-10 flex items-center px-4 gap-2 text-ink font-bold uppercase tracking-wider hover:bg-cream transition-colors cursor-pointer"
            >
              <span className="hidden md:inline text-xs">CART</span>
              <ShoppingCart size={18} strokeWidth={3} />
              {cartCount > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-cream text-ink flex items-center justify-center text-[10px] font-bold rounded-full border border-ink">
                  {cartCount}
                </div>
              )}
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-cream hover:text-primary transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[10001] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-background border-r border-line z-[10002] lg:hidden flex flex-col pt-[env(safe-area-inset-top)]"
            >
              <div className="p-6 border-b border-line flex justify-between items-center">
                <h2 className="font-display text-2xl text-cream uppercase">
                  Menu
                </h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-fg-muted hover:text-cream"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-6 flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-2xl font-display uppercase tracking-wide ${
                      pathname.startsWith(link.href)
                        ? "text-primary"
                        : "text-cream hover:text-primary"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="h-[1px] bg-surface-3 my-2"></div>

                {user ? (
                  <>
                    <Link
                      href="/profile/me"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-mono uppercase text-cream flex items-center gap-4"
                    >
                      <UserIcon size={20} /> My Profile
                    </Link>
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg font-mono uppercase text-primary flex items-center gap-4"
                      >
                        <Shield size={20} /> Admin Panel
                      </Link>
                    ) : null}
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-lg font-mono uppercase text-danger flex items-center gap-4"
                    >
                      <LogOut size={20} /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        openAuthModal("login");
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-lg font-mono uppercase text-cream flex items-center gap-4 text-left"
                    >
                      <LogIn size={20} /> Login
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal("register");
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-lg font-mono uppercase text-fg-muted flex items-center gap-4 text-left"
                    >
                      <UserPlus size={20} /> Register
                    </button>
                    <Link
                      href="/orders/lookup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-mono uppercase text-fg-muted flex items-center gap-4"
                    >
                      <Search size={20} /> Order Lookup
                    </Link>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-line text-[10px] text-fg-faint font-mono uppercase tracking-widest">
                Machine Brain © 2025
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
