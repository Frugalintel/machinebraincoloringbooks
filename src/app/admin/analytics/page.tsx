"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RevenueChart, CategoryChart, KPICard } from "@/components/admin/analytics-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryAnalyticsDashboard } from "@/components/admin/story-analytics-dashboard";

export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    aov: 0,
    conversionRate: 3.2,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch Daily Revenue (RPC)
      const { data: dailyRev } = await supabase.rpc('get_daily_revenue');
      if (dailyRev) {
        setRevenueData(dailyRev.map((d: { date: string; revenue: number }) => ({ date: d.date.split('-').slice(1).join('/'), revenue: d.revenue })));
      }

      // Fetch Category Data (RPC)
      const { data: catData } = await supabase.rpc('get_orders_by_category');
      if (catData) {
        setCategoryData(catData.map((d: { category: string; count: string | number }) => ({ name: d.category || 'Uncategorized', value: Number(d.count) })));
      }

      // Fetch Totals manually
      const { count: orderCount } = await supabase.from('orders').select('id', { count: 'exact', head: true });
      const { data: orders } = await supabase.from('orders').select('total_amount').eq('status', 'paid');
      
      const totalRev = orders?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
      const avgOrder = orders?.length ? totalRev / orders.length : 0;

      setMetrics(prev => ({
        ...prev,
        totalRevenue: totalRev,
        totalOrders: orderCount || 0,
        aov: avgOrder,
      }));

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
     return (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
     );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-2">ANALYTICS</h2>
        <p className="text-gray-500 font-mono text-sm">Revenue Intelligence & Growth Metrics</p>
      </div>

      <Tabs defaultValue="store" className="space-y-8">
        <TabsList className="bg-[#111] border border-[#333]">
            <TabsTrigger value="store" className="data-[state=active]:bg-primary data-[state=active]:text-black font-mono uppercase tracking-widest text-xs">Store</TabsTrigger>
            <TabsTrigger value="stories" className="data-[state=active]:bg-primary data-[state=active]:text-black font-mono uppercase tracking-widest text-xs">Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Total Revenue" 
                    value={`$${metrics.totalRevenue.toLocaleString()}`} 
                    icon={DollarSign} 
                    color="text-green-500"
                    bg="bg-green-500/10"
                />
                <KPICard 
                    title="Total Orders" 
                    value={metrics.totalOrders.toLocaleString()} 
                    icon={ShoppingCart} 
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
                <KPICard 
                    title="Avg. Order Value" 
                    value={`$${metrics.aov.toFixed(2)}`} 
                    icon={TrendingUp} 
                    color="text-purple-500"
                    bg="bg-purple-500/10"
                />
                <KPICard 
                    title="Conversion Rate" 
                    value={`${metrics.conversionRate}%`} 
                    icon={Users} 
                    color="text-orange-500"
                    bg="bg-orange-500/10"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
                <h3 className="font-heading text-xl mb-6">Revenue Trend (Last 30 Days)</h3>
                <RevenueChart data={revenueData} />
                </div>

                <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
                <h3 className="font-heading text-xl mb-6">Sales by Category</h3>
                <CategoryChart data={categoryData} />
                </div>
            </div>
        </TabsContent>

        <TabsContent value="stories">
            <StoryAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
