"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { BookOpen, CheckCircle2, Users, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { KPICard } from "./analytics-charts";

export function StoryAnalyticsDashboard() {
  const [metrics, setMetrics] = useState({
    activeReaders: 0,
    totalCompletions: 0,
    avgCompletionRate: 0,
    totalStoriesStarted: 0,
  });
  const [storyPopularity, setStoryPopularity] = useState<
    { name: string; value: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStoryMetrics() {
      setLoading(true);
      try {
        // 1. Total Stories Started
        const { count: startedCount } = await supabase
          .from("user_story_progress")
          .select("*", { count: "exact", head: true });

        // 2. Total Completions
        const { count: completedCount } = await supabase
          .from("user_story_progress")
          .select("*", { count: "exact", head: true })
          .eq("is_completed", true);

        // 3. Active Readers (users with progress updated in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: activeCount } = await supabase
          .from("user_story_progress")
          .select("user_id", { count: "exact", head: true })
          .gt("started_at", sevenDaysAgo.toISOString()); // Approximate using started_at or we need updated_at column

        // 4. Story Popularity
        const { data: popularStories } = await supabase
          .from("user_story_progress")
          .select("story_id, stories(title)")
          .limit(1000); // Fetch recent 1000 to aggregate locally if no RPC

        const storyCounts: Record<string, number> = {};
        popularStories?.forEach((p) => {
          const record = p as {
            story_id: string;
            stories?: { title: string }[] | { title: string };
          };
          const title = Array.isArray(record.stories)
            ? record.stories[0]?.title
            : record.stories?.title || "Unknown";
          storyCounts[title] = (storyCounts[title] || 0) + 1;
        });

        const chartData = Object.entries(storyCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setMetrics({
          activeReaders: activeCount || 0,
          totalCompletions: completedCount || 0,
          avgCompletionRate: startedCount
            ? Math.round(((completedCount || 0) / startedCount) * 100)
            : 0,
          totalStoriesStarted: startedCount || 0,
        });
        setStoryPopularity(chartData);
      } catch (err) {
        logger.error("Error fetching story metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStoryMetrics();
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Readers (7d)"
          value={metrics.activeReaders.toLocaleString()}
          icon={Users}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <KPICard
          title="Adventures Started"
          value={metrics.totalStoriesStarted.toLocaleString()}
          icon={BookOpen}
          color="text-purple-500"
          bg="bg-purple-500/10"
        />
        <KPICard
          title="Total Completions"
          value={metrics.totalCompletions.toLocaleString()}
          icon={CheckCircle2}
          color="text-green-500"
          bg="bg-green-500/10"
        />
        <KPICard
          title="Completion Rate"
          value={`${metrics.avgCompletionRate}%`}
          icon={Clock}
          color="text-orange-500"
          bg="bg-orange-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
          <h3 className="font-heading text-xl mb-6">Most Popular Adventures</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storyPopularity}>
                <XAxis
                  dataKey="name"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    borderColor: "#333",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ fill: "#222" }}
                />
                <Bar dataKey="value" fill="#ff4f00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Placeholder for future detailed engagement chart */}
        <div className="bg-[#111] border border-[#333] p-6 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p>Node drop-off analytics coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
