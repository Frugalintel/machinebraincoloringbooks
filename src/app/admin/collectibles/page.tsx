"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Box, LayoutGrid, List, Gem } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Collectible } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";

const getRarityStyles = (rarity?: string) => {
    switch(rarity?.toLowerCase()) {
        case 'legendary': return {
            border: 'border-orange-500/60 hover:border-orange-400',
            glow: 'shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_-5px_rgba(249,115,22,0.6)]',
            icon: 'bg-orange-500/30 text-orange-400 border-orange-500/60',
            text: 'text-orange-400',
            bg: 'bg-gradient-to-br from-orange-950/50 via-[#111] to-yellow-950/30',
            accent: 'bg-gradient-to-b from-orange-500 to-yellow-500',
            titleColor: 'text-orange-100'
        };
        case 'epic': return {
            border: 'border-purple-500/60 hover:border-purple-400',
            glow: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.6)]',
            icon: 'bg-purple-500/30 text-purple-400 border-purple-500/60',
            text: 'text-purple-400',
            bg: 'bg-gradient-to-br from-purple-950/50 via-[#111] to-pink-950/30',
            accent: 'bg-gradient-to-b from-purple-500 to-pink-500',
            titleColor: 'text-purple-100'
        };
        case 'rare': return {
            border: 'border-blue-500/60 hover:border-blue-400',
            glow: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.6)]',
            icon: 'bg-blue-500/30 text-blue-400 border-blue-500/60',
            text: 'text-blue-400',
            bg: 'bg-gradient-to-br from-blue-950/50 via-[#111] to-cyan-950/30',
            accent: 'bg-gradient-to-b from-blue-500 to-cyan-500',
            titleColor: 'text-blue-100'
        };
        case 'uncommon': return {
            border: 'border-green-500/60 hover:border-green-400',
            glow: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_-5px_rgba(34,197,94,0.6)]',
            icon: 'bg-green-500/30 text-green-400 border-green-500/60',
            text: 'text-green-400',
            bg: 'bg-gradient-to-br from-green-950/50 via-[#111] to-emerald-950/30',
            accent: 'bg-gradient-to-b from-green-500 to-emerald-500',
            titleColor: 'text-green-100'
        };
        default: return {
            border: 'border-[#333] hover:border-gray-500',
            glow: 'hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]',
            icon: 'bg-[#222] text-gray-400 border-[#444]',
            text: 'text-gray-400',
            bg: 'bg-[#111]',
            accent: 'bg-gray-600',
            titleColor: 'text-white'
        };
    }
};

export default function AdminCollectiblesPage() {
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchCollectibles();
  }, []);

  const fetchCollectibles = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .from('collectibles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setCollectibles(data);
        }
    } catch (error) {
        logger.error("Error fetching collectibles:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (collectible: Collectible) => {
      if (!confirm("Are you sure you want to delete this collectible?")) return;

      try {
          const { error } = await supabase.from('collectibles').delete().eq('id', collectible.id);
          if (error) throw error;
          
          await logAdminAction(
              'delete_collectible',
              'collectibles',
              collectible.id,
              { name: collectible.name }
          );

          setCollectibles(collectibles.filter(c => c.id !== collectible.id));
          success("Collectible deleted successfully.");
      } catch (err) {
          toastError("Failed to delete collectible.");
          logger.error("Error deleting collectible:", err);
      }
  };

  const filteredCollectibles = collectibles.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lore && c.lore.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.type && c.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-heading font-bold mb-1">COLLECTIBLES</h2>
            <p className="text-gray-500 font-mono text-sm">Manage digital artifacts and collectible items.</p>
        </div>
        <Link 
            href="/admin/collectibles/new"
            className="flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors"
        >
            <Plus size={18} />
            <span>ADD COLLECTIBLE</span>
        </Link>
      </div>

      <div className="bg-[#111] border border-[#333] p-4 rounded-lg flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Search collectibles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded py-2 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
            />
        </div>
        <div className="flex items-center gap-2 bg-[#222] p-1 rounded border border-[#333]">
            <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-white'}`}
                title="Grid View"
            >
                <LayoutGrid size={18} />
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-white'}`}
                title="List View"
            >
                <List size={18} />
            </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 font-mono">Loading collectibles...</p>
        </div>
      ) : (
        <>
            {filteredCollectibles.length === 0 && (
                <div className="col-span-full p-20 text-center text-gray-500 bg-[#111] border border-[#333] rounded-lg border-dashed">
                    <Box size={48} className="mx-auto text-gray-700 mb-4" />
                    <p className="font-heading text-lg text-gray-400">No collectibles found</p>
                    <p className="text-sm text-gray-600 mt-2">Create your first collectible to get started.</p>
                </div>
            )}

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCollectibles.map((collectible) => {
                        const styles = getRarityStyles(collectible.rarity);
                        return (
                            <div key={collectible.id} className={`group relative border rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${styles.bg} ${styles.border} ${styles.glow}`}>
                                {/* Colored Accent Bar */}
                                <div className={`absolute top-0 left-0 w-full h-1 ${styles.accent}`}></div>
                                
                                <Link href={`/admin/collectibles/${collectible.id}`} className="block h-full p-4 pt-5 pb-14">
                                    <div className="flex items-start gap-4">
                                        {/* Icon Box */}
                                        <div className={`w-14 h-14 rounded-xl flex shrink-0 items-center justify-center border-2 ${styles.icon}`}>
                                            {collectible.image_url ? (
                                                <img src={collectible.image_url} alt={collectible.name} className="w-10 h-10 object-cover rounded" />
                                            ) : (
                                                <Gem size={20} />
                                            )}
                                        </div>
                                        
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`font-heading font-bold text-sm mb-0.5 truncate pr-6 ${styles.titleColor}`}>{collectible.name}</h3>
                                            <p className={`text-[10px] font-mono uppercase tracking-wide mb-1 ${styles.text}`}>
                                                {collectible.type || 'Artifact'}
                                            </p>
                                            <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles.text} border-current bg-black/30`}>
                                                {collectible.rarity || 'Common'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 line-clamp-2 mt-3 min-h-[2.5em]">
                                        {collectible.lore || 'No lore available.'}
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-3">
                                        <span className="text-[10px] text-gray-500 font-mono uppercase">
                                            {collectible.generation || 'Gen-0'}
                                        </span>
                                        <span className={`text-[10px] font-mono ${styles.text}`}>
                                            {collectible.found_in || 'Unknown'}
                                        </span>
                                    </div>
                                </Link>

                                {/* Actions Footer */}
                                <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex justify-end items-center z-40">
                                    <div className="flex gap-2">
                                        <Link href={`/admin/collectibles/${collectible.id}`} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                                            <Edit size={16} />
                                        </Link>
                                        <button 
                                            onClick={(e) => { e.preventDefault(); handleDelete(collectible); }}
                                            className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#1a1a1a] text-gray-500 font-mono text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="p-4 font-normal">Image</th>
                                    <th className="p-4 font-normal">Name</th>
                                    <th className="p-4 font-normal">Type</th>
                                    <th className="p-4 font-normal">Rarity</th>
                                    <th className="p-4 font-normal">Generation</th>
                                    <th className="p-4 font-normal">Location</th>
                                    <th className="p-4 font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {filteredCollectibles.map((collectible) => {
                                    const styles = getRarityStyles(collectible.rarity);
                                    
                                    return (
                                        <tr key={collectible.id} className="group hover:bg-[#161616] transition-colors">
                                            <td className="p-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${styles.icon}`}>
                                                    {collectible.image_url ? (
                                                        <img src={collectible.image_url} alt={collectible.name} className="w-8 h-8 object-cover rounded" />
                                                    ) : (
                                                        <Gem size={16} />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-heading font-bold text-white text-sm">{collectible.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs text-gray-400 font-mono uppercase">{collectible.type || 'Artifact'}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border bg-opacity-10 ${styles.text} border-current`}>
                                                    {collectible.rarity || 'Common'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs text-gray-500 font-mono">{collectible.generation || 'Gen-0'}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs text-gray-400">{collectible.found_in || 'Unknown'}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/admin/collectibles/${collectible.id}`} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleDelete(collectible)}
                                                        className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
}
