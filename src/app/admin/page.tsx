"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Users, DollarSign, Activity, Plus, Tags, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    { label: "Total Revenue", value: "$0", change: "+0%", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total Orders", value: "0", change: "+0%", icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Products", value: "0", change: "+0", icon: Tags, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Conversion", value: "3.2%", change: "+0.4%", icon: Activity, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]);
  const [activities, setActivities] = useState<{ id: string; type: string; message: string; time: string; value: string }[]>([]);
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
            { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+12%", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Total Orders", value: orderCount?.toString() || "0", change: "+5%", icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Products", value: productCount?.toString() || "0", change: "+2", icon: Tags, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Conversion", value: "3.2%", change: "+0.4%", icon: Activity, color: "text-orange-500", bg: "bg-orange-500/10" },
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
        <h2 className="text-3xl font-heading font-bold mb-1">DASHBOARD</h2>
        <p className="text-gray-500 font-mono text-sm">Welcome back, {user?.email?.split('@')[0] || 'Admin'}. System Status: <span className="text-green-500">ONLINE</span>.</p>
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
                    className="bg-[#111] border border-[#333] p-6 rounded-xl relative overflow-hidden group hover:border-gray-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                            <Icon size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-green-500 bg-green-900/20 px-2 py-1 rounded border border-green-900/30">
                            {stat.change}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold font-heading mb-1 text-white">{loading ? "..." : stat.value}</h3>
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">{stat.label}</p>
                    </div>
                </motion.div>
            )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity - Takes 2 cols */}
        <div className="lg:col-span-2 bg-[#111] border border-[#333] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-lg text-white">Recent Activity</h3>
                <Link href="/admin/audit" className="text-xs font-mono text-primary hover:text-white transition-colors uppercase tracking-wider">
                    View All
                </Link>
            </div>
            
            <div className="space-y-1">
                {loading ? (
                    <div className="text-center text-gray-500 py-12 font-mono text-xs">LOADING STREAM...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-gray-500 py-12 font-mono text-xs">NO RECENT ACTIVITY DETECTED</div>
                ) : (
                    activities.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-[#1a1a1a] rounded-lg transition-colors border-b border-[#222] last:border-0 last:pb-0 group">
                            <div className={`w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center text-xs font-mono border ${
                                item.type === 'order' ? 'bg-green-900/10 text-green-500 border-green-900/30' : 
                                item.type === 'user' ? 'bg-blue-900/10 text-blue-500 border-blue-900/30' : 
                                'bg-gray-800/10 text-gray-400 border-gray-700/30'
                            }`}>
                                {item.type === 'order' ? <DollarSign size={16} /> : item.type === 'user' ? <Users size={16} /> : <Activity size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{item.message}</p>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">
                                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                                </p>
                            </div>
                            {item.value ? <div className="text-sm font-mono text-white font-bold whitespace-nowrap bg-[#222] px-3 py-1 rounded">
                                    {item.value}
                                </div> : null}
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Quick Actions - Takes 1 col */}
        <div className="space-y-6">
             <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                <h3 className="font-heading font-bold text-lg text-white mb-6">Quick Actions</h3>
                <div className="space-y-3">
                    <Link href="/admin/products/new" className="flex items-center gap-4 p-4 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-gray-500 rounded-lg transition-all group">
                        <div className="p-2 bg-primary/10 text-primary rounded group-hover:bg-primary group-hover:text-black transition-colors">
                            <Plus size={20} />
                        </div>
                        <div>
                            <span className="block font-bold text-sm text-white">Add Product</span>
                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Create listing</span>
                        </div>
                        <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                    </Link>
                    
                    <Link href="/admin/discounts" className="flex items-center gap-4 p-4 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-gray-500 rounded-lg transition-all group">
                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <Tags size={20} />
                        </div>
                        <div>
                            <span className="block font-bold text-sm text-white">New Campaign</span>
                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Run promotion</span>
                        </div>
                        <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                    </Link>
                    
                    <Link href="/admin/settings" className="flex items-center gap-4 p-4 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-gray-500 rounded-lg transition-all group">
                        <div className="p-2 bg-gray-700/20 text-gray-400 rounded group-hover:bg-white group-hover:text-black transition-colors">
                            <Settings size={20} />
                        </div>
                        <div>
                            <span className="block font-bold text-sm text-white">Settings</span>
                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">System config</span>
                        </div>
                        <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                    </Link>
                </div>
             </div>

             <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-heading font-bold text-white mb-2">Need Help?</h3>
                    <p className="text-xs text-gray-300 mb-4 leading-relaxed">Check the documentation for the new Stories System layout engine.</p>
                    <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded hover:bg-gray-200 transition-colors uppercase tracking-wider">
                        View Docs
                    </button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
