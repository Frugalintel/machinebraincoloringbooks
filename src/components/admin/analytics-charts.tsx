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
  Cell
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size: number }>;
  color: string;
  bg: string;
}

export function KPICard({ title, value, icon: Icon, color, bg }: KPICardProps) {
    return (
        <div className="bg-[#111] border border-[#333] p-6 rounded-xl relative overflow-hidden group hover:border-gray-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300">
            <div className={`absolute top-4 right-4 p-2 rounded-lg ${bg} ${color}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-bold font-heading text-white">{value}</h3>
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
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="date" 
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
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [`$${value}`, 'Revenue']}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#22c55e" 
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
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
            itemStyle={{ color: '#fff' }}
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
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
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
          />
          <Tooltip 
             contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
             itemStyle={{ color: '#fff' }}
             cursor={{fill: '#222'}}
          />
          <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
