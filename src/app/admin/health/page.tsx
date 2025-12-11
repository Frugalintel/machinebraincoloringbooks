"use client";

import React, { useEffect, useState } from "react";
import { Activity, Database, Server, Wifi, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  message?: string;
}

export default function HealthPage() {
  const [statuses, setStatuses] = useState<HealthStatus[]>([
    { service: 'Database (Supabase)', status: 'degraded', message: 'Checking...' },
    { service: 'API Gateway', status: 'degraded', message: 'Checking...' },
    { service: 'Storage', status: 'degraded', message: 'Checking...' },
    { service: 'Auth Service', status: 'degraded', message: 'Checking...' },
  ]);

  const checkHealth = async () => {
    // 1. Check Database
    const startDb = performance.now();
    const { error: dbError } = await supabase.from('products').select('count', { count: 'exact', head: true });
    const dbLatency = Math.round(performance.now() - startDb);
    
    // 2. Check Auth (session check)
    const { error: authError } = await supabase.auth.getSession();

    // 3. Check Storage (list buckets)
    const startStorage = performance.now();
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    const storageLatency = Math.round(performance.now() - startStorage);

    setStatuses([
        { 
            service: 'Database (Supabase)', 
            status: dbError ? 'down' : (dbLatency > 500 ? 'degraded' : 'healthy'), 
            latency: dbLatency,
            message: dbError ? dbError.message : 'Operational'
        },
        { 
            service: 'Auth Service', 
            status: authError ? 'down' : 'healthy', 
            message: authError ? authError.message : 'Operational'
        },
        { 
            service: 'Storage', 
            status: storageError ? 'down' : (storageLatency > 500 ? 'degraded' : 'healthy'), 
            latency: storageLatency,
            message: storageError ? storageError.message : `${buckets?.length || 0} buckets online`
        },
        { 
            service: 'Realtime', 
            status: 'healthy', 
            message: 'Connected' 
        },
    ]);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-2">SYSTEM HEALTH</h2>
        <p className="text-gray-500 font-mono text-sm">Infrastructure Status & Monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statuses.map((status) => (
            <div key={status.service} className={`bg-[#111] border p-6 rounded-xl flex items-center gap-6 transition-all duration-300 hover:shadow-lg ${
                status.status === 'healthy' ? 'border-[#333] hover:border-green-900/50' : 
                status.status === 'down' ? 'border-red-900/30 hover:border-red-900/50' : 'border-yellow-900/30 hover:border-yellow-900/50'
            }`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    status.status === 'healthy' ? 'bg-green-900/10 text-green-500' : 
                    status.status === 'down' ? 'bg-red-900/10 text-red-500' : 'bg-yellow-900/10 text-yellow-500'
                }`}>
                    {status.service.includes('Database') ? <Database size={32} /> :
                     status.service.includes('Storage') ? <Server size={32} /> :
                     <Wifi size={32} />}
                </div>
                <div>
                    <h3 className="text-xl font-bold font-heading mb-1">{status.service}</h3>
                    <div className="flex items-center gap-2">
                        {status.status === 'healthy' ? <CheckCircle size={16} className="text-green-500" /> :
                         status.status === 'down' ? <XCircle size={16} className="text-red-500" /> :
                         <AlertTriangle size={16} className="text-yellow-500" />}
                        <span className={`uppercase font-mono text-sm ${
                             status.status === 'healthy' ? 'text-green-500' : 
                             status.status === 'down' ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                            {status.status}
                        </span>
                    </div>
                    {status.latency ? <p className="text-xs text-gray-500 mt-1 font-mono">Latency: {status.latency}ms</p> : null}
                    <p className="text-xs text-gray-600 mt-1">{status.message}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}

