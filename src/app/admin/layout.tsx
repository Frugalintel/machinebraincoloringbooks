"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  ChevronLeft,
  Trophy,
  BookOpen,
  BarChart2,
  Activity,
  ShieldCheck,
  Menu,
  X,
  Store
} from "lucide-react";
import { AdminNotificationProvider } from "@/components/admin/notifications";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/");
    }
  }, [isLoading, isAdmin, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { label: "Products", href: "/admin/products", icon: ShoppingBag },
    { label: "Stories", href: "/admin/stories", icon: BookOpen },
    { label: "Achievements", href: "/admin/achievements", icon: Trophy },
    { label: "Discounts", href: "/admin/discounts", icon: Tags },
    { label: "Audit Log", href: "/admin/audit", icon: ShieldCheck },
    { label: "Health", href: "/admin/health", icon: Activity },
    { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <AdminNotificationProvider>
      <div className="min-h-screen bg-black text-white flex font-sans">
        
        {/* Mobile Header - Unified Style */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-[#111] border-b border-[#333] z-[60] flex items-center justify-between px-4 md:hidden">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-white hover:bg-[#222] rounded">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <span className="font-heading font-bold text-lg tracking-wide uppercase">Machine Brain</span>
            </div>
            {/* Branding/User on right */}
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {user?.initials || 'A'}
            </div>
        </div>

        {/* Sidebar (Desktop: Fixed, Mobile: Overlay) */}
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-[#111] border-r border-[#333] flex-col transition-transform duration-300 shadow-2xl md:shadow-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 md:flex
        `}>
          <div className="p-6 border-b border-[#333] hidden md:block">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-white rounded-full"></div> {/* Logo Placeholder */}
                <span className="font-heading font-bold text-lg tracking-wide">MACHINE BRAIN</span>
            </div>
            
            <div className="bg-[#222] p-3 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {user?.initials || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Admin User'}</p>
                    <p className="text-[10px] text-gray-500 font-mono truncate">{user?.email}</p>
                </div>
            </div>
          </div>

          {/* Mobile User Info in Sidebar Header */}
          <div className="p-6 border-b border-[#333] md:hidden mt-16 bg-[#111]">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Logged in as</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {user?.initials || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                    isActive 
                      ? "bg-primary text-black font-bold" 
                      : "text-gray-400 hover:bg-[#222] hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm tracking-wide uppercase">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#333] space-y-2">
            <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-gray-400 hover:bg-[#222] hover:text-white transition-all"
            >
                <Store size={18} />
                <span className="text-sm tracking-wide uppercase">Back to Store</span>
            </Link>
            
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-red-500 hover:bg-red-900/20 transition-all"
            >
              <LogOut size={18} />
              <span className="text-sm tracking-wide uppercase">Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64 min-h-screen bg-[#050505] relative w-full">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none fixed"></div>
           <div className="p-4 pt-20 md:p-8 md:pt-8 relative z-10">
              {children}
           </div>
        </main>
      </div>
    </AdminNotificationProvider>
  );
}
