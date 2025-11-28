"use client";

import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import { ShoppingBag, Users, DollarSign, Activity, Plus, Tags, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: "Total Revenue", value: "$12,450", change: "+12%", icon: DollarSign, color: "text-green-500" },
    { label: "Active Users", value: "1,240", change: "+5%", icon: Users, color: "text-blue-500" },
    { label: "Products", value: "24", change: "+2", icon: ShoppingBag, color: "text-purple-500" },
    { label: "Conversion", value: "3.2%", change: "+0.4%", icon: Activity, color: "text-orange-500" },
  ];

  const activities = [
      { id: 1, type: "order", message: "New order #8821", time: "2 minutes ago", value: "+$24.00" },
      { id: 2, type: "user", message: "New user registration", time: "15 minutes ago", value: "" },
      { id: 3, type: "order", message: "New order #8820", time: "1 hour ago", value: "+$12.00" },
      { id: 4, type: "system", message: "Database backup completed", time: "3 hours ago", value: "" },
      { id: 5, type: "order", message: "New order #8819", time: "5 hours ago", value: "+$45.00" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-2">DASHBOARD</h2>
        <p className="text-gray-500 font-mono text-sm">Welcome back, {user?.initials || 'Admin'}. System Status: ONLINE.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#111] border border-[#333] p-6 rounded-lg relative overflow-hidden group hover:border-primary/30 transition-colors"
                >
                    <div className={`absolute top-4 right-4 p-2 rounded-full bg-[#222] ${stat.color} bg-opacity-10`}>
                        <Icon size={20} className={stat.color} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold font-heading mb-2">{stat.value}</h3>
                        <span className="text-xs font-mono text-green-500 bg-green-900/20 px-2 py-1 rounded">
                            {stat.change} vs last month
                        </span>
                    </div>
                </motion.div>
            )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
            <h3 className="font-heading text-xl mb-6">Recent Activity</h3>
            <div className="space-y-4">
                {activities.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 border-b border-[#222] pb-4 last:border-0 last:pb-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono ${
                            item.type === 'order' ? 'bg-green-900/20 text-green-500' : 
                            item.type === 'user' ? 'bg-blue-900/20 text-blue-500' : 
                            'bg-gray-800 text-gray-400'
                        }`}>
                            {item.type === 'order' ? <DollarSign size={14} /> : item.type === 'user' ? <Users size={14} /> : <Activity size={14} />}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{item.message}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.time}</p>
                        </div>
                        {item.value && (
                            <div className="ml-auto text-sm font-mono text-primary">
                                {item.value}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
             <h3 className="font-heading text-xl mb-6">Quick Actions</h3>
             <div className="grid grid-cols-2 gap-4">
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
