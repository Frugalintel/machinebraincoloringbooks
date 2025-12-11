"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, BookOpen, Clock, BarChart, List, LayoutGrid } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setStories(data);
        }
    } catch (error) {
        logger.error("Error fetching stories:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (story: Story) => {
      if (!confirm("Are you sure you want to delete this story?")) return;

      try {
          const { error } = await supabase.from('stories').delete().eq('id', story.id);
          if (error) throw error;
          
          await logAdminAction(
              'delete_story',
              'stories',
              story.id,
              { title: story.title }
          );

          setStories(stories.filter(s => s.id !== story.id));
          success("Story deleted successfully.");
      } catch (err) {
          toastError("Failed to delete story.");
          logger.error("Error deleting story:", err);
      }
  };

  const filteredStories = stories.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-heading font-bold mb-1">STORIES</h2>
            <p className="text-gray-500 font-mono text-sm">Manage interactive narratives.</p>
        </div>
        <Link 
            href="/admin/stories/new"
            className="flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors"
        >
            <Plus size={18} />
            <span>ADD STORY</span>
        </Link>
      </div>

      <div className="bg-[#111] border border-[#333] p-4 rounded-lg flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Search stories..." 
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
            <p className="text-gray-500 font-mono">Loading stories...</p>
        </div>
      ) : (
        <>
            {filteredStories.length === 0 && (
                <div className="col-span-full p-20 text-center text-gray-500 bg-[#111] border border-[#333] rounded-lg border-dashed">
                    <BookOpen size={48} className="mx-auto text-gray-700 mb-4" />
                    <p className="font-heading text-lg text-gray-400">No stories found</p>
                </div>
            )}

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredStories.map((story) => (
                        <div key={story.id} className="group relative bg-[#111] border border-[#333] hover:border-gray-500 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3 z-30">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-md border shadow-sm ${
                                    story.is_published 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                    : 'bg-black/60 text-gray-400 border-white/10'
                                }`}>
                                    {story.is_published ? 'Published' : 'Draft'}
                                </span>
                            </div>

                            <Link href={`/admin/stories/${story.id}`} className="block h-full">
                                {/* Cover Image */}
                                <div className="aspect-[3/4] relative w-full overflow-hidden bg-[#050505]">
                                    <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-20 mix-blend-overlay z-10 pointer-events-none"></div>
                                    
                                    {story.cover_url ? (
                                        <img src={story.cover_url} alt={story.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
                                            <BookOpen size={48} className="text-white/20" />
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent z-20"></div>

                                    {/* Content Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5 z-30">
                                        <div className="mb-3">
                                            <h3 className="font-heading text-xl font-bold text-white leading-tight mb-1 truncate">{story.title}</h3>
                                            <p className="text-xs text-gray-400 line-clamp-2">{story.synopsis}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-mono uppercase tracking-wider">{story.estimated_minutes || 15} MIN</span>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, idx) => (
                                                    <div key={idx} className={`w-1 h-2 rounded-sm ${idx < (story.difficulty || 1) ? 'bg-primary' : 'bg-[#333]'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Actions Footer */}
                            <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex justify-between items-center z-40">
                                <span className="text-[10px] text-gray-500 font-mono pl-1">
                                    {story.content?.length || 0} Nodes
                                </span>
                                
                                <div className="flex gap-2">
                                    <Link href={`/admin/stories/${story.id}`} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                                        <Edit size={16} />
                                    </Link>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); handleDelete(story); }}
                                        className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#1a1a1a] text-gray-500 font-mono text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="p-4 font-normal">Cover</th>
                                    <th className="p-4 font-normal">Title</th>
                                    <th className="p-4 font-normal">Synopsis</th>
                                    <th className="p-4 font-normal">Details</th>
                                    <th className="p-4 font-normal">Status</th>
                                    <th className="p-4 font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {filteredStories.map((story) => (
                                    <tr key={story.id} className="group hover:bg-[#161616] transition-colors">
                                        <td className="p-4">
                                            <div className="w-12 h-16 bg-[#222] rounded overflow-hidden relative">
                                                {story.cover_url ? (
                                                    <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen size={16} className="text-gray-600" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-heading font-bold text-white text-sm truncate max-w-[200px]">{story.title}</div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-1">Nodes: {story.content?.length || 0}</div>
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            <p className="text-xs text-gray-400 truncate">{story.synopsis}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Clock size={12} />
                                                    <span className="text-[10px] font-mono">{story.estimated_minutes || 15} min</span>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <div key={idx} className={`w-1 h-1.5 rounded-[1px] ${idx < (story.difficulty || 1) ? 'bg-primary' : 'bg-[#333]'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                                                story.is_published 
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                                : 'bg-gray-800 text-gray-500 border-gray-700'
                                            }`}>
                                                {story.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/stories/${story.id}`} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                                                    <Edit size={16} />
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(story)}
                                                    className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
