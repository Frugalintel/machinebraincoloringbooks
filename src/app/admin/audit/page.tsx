"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { Shield, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, User as UserIcon, Calendar, Activity, Database, ChevronDown, ChevronUp } from "lucide-react";

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_resource: string;
  target_id: string;
  details: any;
  created_at: string;
  admin_email?: string; 
}

const ITEMS_PER_PAGE = 20;

const ActionBadge = ({ action }: { action: string }) => {
    let color = 'bg-gray-800 text-gray-400 border-gray-700';
    let icon = <Activity size={12} />;

    if (action.includes('delete')) {
        color = 'bg-red-950/40 text-red-400 border-red-900/50';
    } else if (action.includes('create')) {
        color = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50';
    } else if (action.includes('update')) {
        color = 'bg-blue-950/40 text-blue-400 border-blue-900/50';
    } else if (action.includes('publish') || action.includes('activate')) {
        color = 'bg-purple-950/40 text-purple-400 border-purple-900/50';
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wide border ${color} whitespace-nowrap`}>
            {icon}
            {action.replace(/_/g, ' ')}
        </span>
    );
};

const DetailsCell = ({ details }: { details: any }) => {
    const [expanded, setExpanded] = useState(false);
    const jsonString = JSON.stringify(details, null, 2);
    const summary = JSON.stringify(details).substring(0, 40);

    return (
        <div className="relative group">
            <div 
                className="text-gray-500 font-mono text-xs cursor-pointer hover:text-white transition-colors flex items-center gap-1"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <span className="truncate max-w-[150px] md:max-w-[200px]">{expanded ? 'Hide Details' : summary + (jsonString.length > 40 ? '...' : '')}</span>
            </div>
            
            {expanded && (
                <div className="absolute top-6 right-0 md:left-0 z-50 w-[280px] md:w-[300px] bg-[#0a0a0a] border border-[#333] rounded p-3 shadow-xl text-xs font-mono text-gray-300 overflow-auto max-h-[200px]">
                    <pre className="whitespace-pre-wrap">{jsonString}</pre>
                </div>
            )}
        </div>
    );
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

    if (filterAction !== 'all') {
        query = query.ilike('action', `%${filterAction}%`);
    }

    const { data: logsData, error } = await query;

    if (logsData) {
        if (logsData.length < ITEMS_PER_PAGE) {
            setHasMore(false);
        } else {
            setHasMore(true);
        }

        // Fetch admin emails 
        const userIds = Array.from(new Set(logsData.map(l => l.admin_id).filter(Boolean)));
        const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);
        
        const enrichedLogs = logsData.map(log => ({
            ...log,
            admin_email: profiles?.find(p => p.id === log.admin_id)?.email || 'Unknown Admin'
        }));
        
        setLogs(enrichedLogs);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    searchTerm === "" ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-2 tracking-tight">AUDIT LOG</h2>
        <p className="text-gray-500 font-mono text-sm">Monitor administrative activity and security events.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-[#111] p-1.5 rounded-xl border border-[#222]">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input 
                type="text" 
                placeholder="Search logs..." 
                className="w-full bg-transparent border-none focus:ring-0 pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         
         <div className="h-6 w-[1px] bg-[#333] hidden md:block"></div>

         <div className="flex items-center gap-2 w-full md:w-auto px-2">
             <div className="relative flex-1 md:flex-none">
                 <select 
                    value={filterAction}
                    onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
                    className="w-full md:w-auto bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none appearance-none pr-8 cursor-pointer transition-colors font-mono uppercase"
                 >
                     <option value="all">All Actions</option>
                     <option value="create">Create</option>
                     <option value="update">Update</option>
                     <option value="delete">Delete</option>
                     <option value="publish">Publish</option>
                 </select>
                 <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
             </div>
             
             <button 
                onClick={() => { setPage(0); fetchLogs(); }}
                className="p-1.5 hover:bg-[#222] rounded-lg text-gray-500 hover:text-white transition-colors"
                title="Refresh"
             >
                <RefreshCw size={16} />
             </button>
         </div>
      </div>

      <div className="border border-[#222] rounded-xl overflow-hidden bg-[#0a0a0a]">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px] table-fixed">
                <thead className="bg-[#111] text-gray-500 font-mono text-[10px] uppercase tracking-wider border-b border-[#222]">
                    <tr>
                        <th className="p-4 w-[180px] font-medium">Timestamp</th>
                        <th className="p-4 w-[200px] font-medium">Actor</th>
                        <th className="p-4 w-[200px] font-medium">Action</th>
                        <th className="p-4 w-[150px] font-medium">Resource</th>
                        <th className="p-4 font-medium">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-gray-500">
                                <div className="flex justify-center items-center gap-3">
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                                    <span className="font-mono text-xs animate-pulse">SYNCING LOGS...</span>
                                </div>
                            </td>
                        </tr>
                    ) : filteredLogs.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-gray-600 font-mono text-xs">
                                NO ACTIVITY FOUND MATCHING CRITERIA
                            </td>
                        </tr>
                    ) : (
                        filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-[#111] transition-colors group">
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="text-gray-300 font-medium text-xs">
                                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                        </span>
                                        <span className="text-gray-600 text-[10px] font-mono group-hover:text-gray-500 transition-colors">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-gray-400">
                                            <UserIcon size={14} />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-white text-xs font-medium truncate" title={log.admin_email}>
                                                {log.admin_email?.split('@')[0]}
                                            </span>
                                            <span className="text-gray-600 text-[10px] truncate">
                                                {log.admin_email}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <ActionBadge action={log.action} />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Database size={12} />
                                        <span className="font-mono text-xs uppercase tracking-wide">{log.target_resource}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <DetailsCell details={log.details} />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        <div className="p-3 border-t border-[#222] bg-[#111] flex items-center justify-between">
            <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#222] text-xs font-mono text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft size={14} /> PREV
            </button>
            <span className="text-[10px] text-gray-600 font-mono tracking-widest">PAGE {page + 1}</span>
            <button 
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#222] text-xs font-mono text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                NEXT <ChevronRight size={14} />
            </button>
        </div>
      </div>
    </div>
  );
}
