"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, User as UserIcon, Menu, X, LogIn, UserPlus, Package, Settings, LogOut, ChevronDown, Shield } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Store", href: "/store" },
  { name: "Stories", href: "/stories" },
  { name: "Collectibles", href: "/collectibles" },
  { name: "About", href: "/about" },
];

export function Navbar() {
  const { setIsCartOpen, cartCount } = useCart();
  const { user, signOut, openAuthModal, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Black Friday Banner */}
      <Link href="/store" className="block w-full bg-[#e63946] hover:bg-red-700 transition-colors z-50">
        <div className="container mx-auto px-4 h-8 flex items-center justify-center gap-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-white">
            <span className="font-bold">Black Friday Event</span>
            <span className="hidden md:inline">•</span>
            <span>30% OFF ALL BOOKS</span>
            <span className="hidden md:inline">•</span>
            <span className="underline">SHOP NOW</span>
        </div>
      </Link>

      <nav className="w-full border-b border-[#333] bg-[#111] z-50 sticky top-0">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-8 md:gap-12">
            <Link href="/" className="flex flex-col leading-none tracking-tighter group">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-4xl font-heading font-bold text-white uppercase group-hover:text-primary transition-colors">
                  Machine Brain
                </h1>
                <div className="w-2 h-2 md:w-3 md:h-3 bg-primary mt-1 group-hover:bg-white transition-colors"></div>
              </div>
              <span className="text-[10px] md:text-sm text-gray-400 uppercase tracking-[0.2em] font-sans">
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
                            pathname.startsWith(link.href) ? "text-white border-b-2 border-primary pb-1" : "text-gray-500"
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
                  <div className="bg-[#222] h-10 flex items-center px-4 gap-3 text-gray-400 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors cursor-pointer border border-[#333]">
                      <span className="text-xs">Search</span>
                      <Search size={14} strokeWidth={3} />
                  </div>
              </div>

              {/* Profile Dropdown */}
              <div className="relative hidden md:block" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center justify-center w-10 h-10 border border-[#333] transition-colors ${isProfileOpen || user ? "bg-primary text-black border-primary hover:bg-white" : "hover:bg-primary hover:border-primary hover:text-black text-white"}`}
                  >
                      {user ? (
                          <span className="font-heading font-bold text-sm tracking-wide">{user.initials}</span>
                      ) : (
                          <UserIcon size={18} />
                      )}
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-12 right-0 w-56 bg-[#0a0a0a] border border-[#333] shadow-2xl z-50 flex flex-col"
                        >
                            <div className="h-1 w-full bg-primary"></div>
                            {user ? (
                                <>
                                    <div className="p-4 border-b border-[#333]">
                                        <p className="text-white font-heading uppercase">User_{user.initials}</p>
                                        <p className="text-[10px] text-gray-500 font-mono truncate">{user.email}</p>
                                    </div>
                                    <Link href="/profile/me" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#151515] flex items-center gap-3 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                        <UserIcon size={14} /> My Profile
                                    </Link>
                                    <Link href="/profile/me" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#151515] flex items-center gap-3 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                        <Package size={14} /> Order History
                                    </Link>
                                    {isAdmin && (
                                        <Link href="/admin" className="px-4 py-3 text-sm text-primary hover:text-white hover:bg-primary/10 flex items-center gap-3 transition-colors border-t border-[#333]" onClick={() => setIsProfileOpen(false)}>
                                            <Shield size={14} /> Admin Panel
                                        </Link>
                                    )}
                                    <button onClick={() => { signOut(); setIsProfileOpen(false); }} className="px-4 py-3 text-sm text-red-500 hover:bg-red-900/20 hover:text-red-400 flex items-center gap-3 transition-colors text-left w-full border-t border-[#333]">
                                        <LogOut size={14} /> Disconnect
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { openAuthModal('login'); setIsProfileOpen(false); }} className="px-4 py-3 text-sm text-white hover:bg-[#151515] flex items-center gap-3 transition-colors border-b border-[#333] w-full text-left">
                                        <LogIn size={14} className="text-primary" /> 
                                        <span className="font-heading uppercase tracking-wider">Login</span>
                                    </button>
                                    <button onClick={() => { openAuthModal('register'); setIsProfileOpen(false); }} className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#151515] flex items-center gap-3 transition-colors w-full text-left">
                                        <UserPlus size={14} /> Register
                                    </button>
                                    <Link href="/orders/lookup" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#151515] flex items-center gap-3 transition-colors border-t border-[#333]" onClick={() => setIsProfileOpen(false)}>
                                        <Search size={14} /> Order Lookup
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* Cart Trigger */}
              <button 
                  onClick={() => setIsCartOpen(true)}
                  className="relative bg-primary h-10 flex items-center px-4 gap-2 text-black font-bold uppercase tracking-wider hover:bg-white transition-colors cursor-pointer"
              >
                  <span className="hidden md:inline text-xs">CART</span>
                  <ShoppingCart size={18} strokeWidth={3} />
                  {cartCount > 0 && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-white text-black flex items-center justify-center text-[10px] font-bold rounded-full border border-black">
                          {cartCount}
                      </div>
                  )}
              </button>
              
              {/* Mobile Menu Trigger */}
              <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-white hover:text-primary transition-colors"
              >
                  <Menu size={24} />
              </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] lg:hidden"
                />
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-[#111] border-r border-[#333] z-[70] lg:hidden flex flex-col"
                >
                    <div className="p-6 border-b border-[#333] flex justify-between items-center">
                         <h2 className="font-heading text-2xl text-white uppercase">Menu</h2>
                         <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                             <X size={24} />
                         </button>
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col gap-6">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`text-2xl font-heading uppercase tracking-wide ${
                                    pathname.startsWith(link.href) ? "text-primary" : "text-white hover:text-primary"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="h-[1px] bg-[#333] my-2"></div>
                        
                        {user ? (
                            <>
                                <Link href="/profile/me" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-mono uppercase text-white flex items-center gap-4">
                                    <UserIcon size={20} /> My Profile
                                </Link>
                                {isAdmin && (
                                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-mono uppercase text-primary flex items-center gap-4">
                                        <Shield size={20} /> Admin Panel
                                    </Link>
                                )}
                                <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="text-lg font-mono uppercase text-red-500 flex items-center gap-4">
                                    <LogOut size={20} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { openAuthModal('login'); setIsMobileMenuOpen(false); }} className="text-lg font-mono uppercase text-white flex items-center gap-4 text-left">
                                    <LogIn size={20} /> Login
                                </button>
                                <button onClick={() => { openAuthModal('register'); setIsMobileMenuOpen(false); }} className="text-lg font-mono uppercase text-gray-400 flex items-center gap-4 text-left">
                                    <UserPlus size={20} /> Register
                                </button>
                                <Link href="/orders/lookup" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-mono uppercase text-gray-400 flex items-center gap-4">
                                    <Search size={20} /> Order Lookup
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="p-6 border-t border-[#333] text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                        Machine Brain © 2025
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </>
  );
}
