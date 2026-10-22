"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#F2EAD8", "#6FB3A8", "#B58DB6", "#D6A85A", "#979288"];

const CHART_CHROME = {
  grid: "#33322F",
  axis: "#6A675F",
  tooltipBg: "#1A1A19",
  tooltipBorder: "1px solid #33322F",
  tooltipText: "#F2EAD8",
  cursor: "#21211F",
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size: number }>;
  color: string;
  bg: string;
}

export function KPICard({ title, value, icon: Icon, color, bg }: KPICardProps) {
  return (
    <div className="bg-surface-1 border border-line p-6 rounded-xl relative overflow-hidden group hover:border-line-strong hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300">
      <div className={`absolute top-4 right-4 p-2 rounded-lg ${bg} ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-fg-muted text-xs font-mono uppercase tracking-widest mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-bold font-heading text-cream">{value}</h3>
      </div>
    </div>
  );
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6FB3A8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6FB3A8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_CHROME.grid}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke={CHART_CHROME.axis}
            tick={{ fill: "#979288" }}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={CHART_CHROME.axis}
            tick={{ fill: "#979288" }}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_CHROME.tooltipBg,
              border: CHART_CHROME.tooltipBorder,
              borderRadius: "4px",
            }}
            itemStyle={{ color: CHART_CHROME.tooltipText }}
            formatter={(value: number) => [`$${value}`, "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6FB3A8"
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CategoryDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export function CategoryChart({ data }: { data: CategoryDataPoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#F2EAD8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_CHROME.tooltipBg,
              border: CHART_CHROME.tooltipBorder,
            }}
            itemStyle={{ color: CHART_CHROME.tooltipText }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface UserGrowthDataPoint {
  name: string;
  users: number;
}

export function UserGrowthChart({ data }: { data: UserGrowthDataPoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_CHROME.grid}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke={CHART_CHROME.axis}
            tick={{ fill: "#979288" }}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={CHART_CHROME.axis}
            tick={{ fill: "#979288" }}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_CHROME.tooltipBg,
              border: CHART_CHROME.tooltipBorder,
            }}
            itemStyle={{ color: CHART_CHROME.tooltipText }}
            cursor={{ fill: CHART_CHROME.cursor }}
          />
          <Bar dataKey="users" fill="#B58DB6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
