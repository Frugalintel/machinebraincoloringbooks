"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import { ShoppingBag, Users, DollarSign, Activity, Plus, Tags, Settings } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    { label: "Total Revenue", value: "$0", change: "+0%", icon: DollarSign, color: "text-green-500" },
    { label: "Total Orders", value: "0", change: "+0%", icon: ShoppingBag, color: "text-blue-500" },
    { label: "Products", value: "0", change: "+0", icon: Tags, color: "text-purple-500" },
    { label: "Conversion", value: "3.2%", change: "+0.4%", icon: Activity, color: "text-orange-500" },
  ]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);

        // 1. Stats
        // Revenue
        const { data: revenueData } = await supabase.from('orders').select('total_amount').eq('status', 'paid');
        const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

        // Orders count
        const { count: orderCount } = await supabase.from('orders').select('id', { count: 'exact', head: true });

        // Products count
        const { count: productCount } = await supabase.from('products').select('id', { count: 'exact', head: true });

        // Update stats
        setStats([
            { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+12%", icon: DollarSign, color: "text-green-500" },
            { label: "Total Orders", value: orderCount?.toString() || "0", change: "+5%", icon: ShoppingBag, color: "text-blue-500" },
            { label: "Products", value: productCount?.toString() || "0", change: "+2", icon: Tags, color: "text-purple-500" },
            { label: "Conversion", value: "3.2%", change: "+0.4%", icon: Activity, color: "text-orange-500" },
        ]);

        // 2. Recent Activity (Mix of Orders and Admin Logs)
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('id, created_at, total_amount, status')
            .order('created_at', { ascending: false })
            .limit(5);

        const formattedOrders = recentOrders?.map(o => ({
            id: o.id,
            type: 'order',
            message: `New order #${o.id.substring(0,8)}`,
            time: o.created_at,
            value: `+$${o.total_amount}`
        })) || [];

        const { data: recentLogs } = await supabase
            .from('admin_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        const formattedLogs = recentLogs?.map(l => ({
            id: l.id,
            type: 'system',
            message: `Admin: ${l.action} on ${l.target_resource}`,
            time: l.created_at,
            value: ''
        })) || [];

        // Combine and sort
        const combined = [...formattedOrders, ...formattedLogs]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 5);

        setActivities(combined);
        setLoading(false);
    }

    fetchData();

    // Realtime subscription for live updates
    const channel = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
            fetchData(); // Reload on new order
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">DASHBOARD</h2>
        <p className="text-gray-500 font-mono text-xs md:text-sm">Welcome back, {user?.email || 'Admin'}. System Status: ONLINE.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#111] border border-[#333] p-4 md:p-6 rounded-lg relative overflow-hidden group hover:border-primary/30 transition-colors"
                >
                    <div className={`absolute top-4 right-4 p-2 rounded-full bg-[#222] ${stat.color} bg-opacity-10`}>
                        <Icon size={20} className={stat.color} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl md:text-3xl font-bold font-heading mb-2">{loading ? "..." : stat.value}</h3>
                        <span className="text-xs font-mono text-green-500 bg-green-900/20 px-2 py-1 rounded">
                            {stat.change} vs last month
                        </span>
                    </div>
                </motion.div>
            )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Activity */}
        <div className="bg-[#111] border border-[#333] p-4 md:p-6 rounded-lg">
            <h3 className="font-heading text-lg md:text-xl mb-6">Recent Activity</h3>
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-gray-500 py-8">Loading activity...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No recent activity.</div>
                ) : (
                    activities.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 border-b border-[#222] pb-4 last:border-0 last:pb-0">
                            <div className={`w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center text-xs font-mono ${
                                item.type === 'order' ? 'bg-green-900/20 text-green-500' : 
                                item.type === 'user' ? 'bg-blue-900/20 text-blue-500' : 
                                'bg-gray-800 text-gray-400'
                            }`}>
                                {item.type === 'order' ? <DollarSign size={14} /> : item.type === 'user' ? <Users size={14} /> : <Activity size={14} />}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{item.message}</p>
                                <p className="text-xs text-gray-500 font-mono">
                                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                                </p>
                            </div>
                            {item.value && (
                                <div className="ml-auto text-sm font-mono text-primary whitespace-nowrap">
                                    {item.value}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111] border border-[#333] p-4 md:p-6 rounded-lg">
             <h3 className="font-heading text-lg md:text-xl mb-6">Quick Actions</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/products/new" className="p-4 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-left transition-colors group">
                    <div className="mb-3 text-primary group-hover:text-white transition-colors">
                        <Plus size={24} />
                    </div>
                    <span className="block font-bold mb-1 text-white">Add Product</span>
                    <span className="text-xs text-gray-500">Create new listing</span>
                </Link>
                
                <Link href="/admin/discounts" className="p-4 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-left transition-colors group">
                    <div className="mb-3 text-purple-500 group-hover:text-white transition-colors">
                        <Tags size={24} />
                    </div>
                    <span className="block font-bold mb-1 text-white">Create Discount</span>
                    <span className="text-xs text-gray-500">Run a promotion</span>
                </Link>
                
                <Link href="/admin/settings" className="p-4 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-left transition-colors group">
                    <div className="mb-3 text-gray-400 group-hover:text-white transition-colors">
                        <Settings size={24} />
                    </div>
                    <span className="block font-bold mb-1 text-white">System Settings</span>
                    <span className="text-xs text-gray-500">Configure store</span>
                </Link>

                <div className="p-4 bg-[#222]/50 border border-[#333] rounded text-left opacity-50 cursor-not-allowed">
                    <div className="mb-3 text-gray-600">
                        <Users size={24} />
                    </div>
                    <span className="block font-bold mb-1 text-gray-500">Manage Users</span>
                    <span className="text-xs text-gray-600">Coming Soon</span>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
