"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  ChevronLeft,
  Trophy,
  BookOpen
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/");
    }
  }, [isLoading, isAdmin, router]);

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
    { label: "Products", href: "/admin/products", icon: ShoppingBag },
    { label: "Stories", href: "/admin/stories", icon: BookOpen },
    { label: "Achievements", href: "/admin/achievements", icon: Trophy },
    { label: "Discounts", href: "/admin/discounts", icon: Tags },
    { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#333] bg-[#111] flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-[#333]">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-primary transition-colors">
            <ChevronLeft size={16} />
            <span className="font-heading tracking-widest text-sm">BACK TO STORE</span>
          </Link>
          <div className="mt-6">
            <h1 className="font-heading text-xl">ADMIN PANEL</h1>
            <p className="text-xs text-gray-500 font-mono mt-1">{user?.email}</p>
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

        <div className="p-4 border-t border-[#333]">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-red-500 hover:bg-red-900/20 transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm tracking-wide uppercase">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen bg-[#050505] relative">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none fixed"></div>
         <div className="p-8 relative z-10">
            {children}
         </div>
      </main>
    </div>
  );
}

