"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, BookOpen, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/context/toast-context";

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
        console.error("Error fetching stories:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleToggleStatus = async (story: Story) => {
      try {
          const newStatus = !story.is_published;
          const { error } = await supabase
            .from('stories')
            .update({ is_published: newStatus })
            .eq('id', story.id);

          if (error) throw error;

          setStories(stories.map(s => s.id === story.id ? { ...s, is_published: newStatus } : s));
          success(newStatus ? "Story published." : "Story unpublished.");
      } catch (err) {
          toastError("Failed to update story status.");
          console.error(err);
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this story?")) return;

      try {
          const { error, count } = await supabase
            .from('stories')
            .delete({ count: 'exact' })
            .eq('id', id);

          if (error) throw error;
          
          if (count === 0) {
            throw new Error("Story could not be deleted. Check your permissions.");
          }

          setStories(stories.filter(s => s.id !== id));
          success("Story deleted successfully.");
      } catch (err) {
          toastError("Failed to delete story.");
          console.error(err);
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
            <p className="text-gray-500 font-mono text-sm">Manage interactive lore and adventures.</p>
        </div>
        <Link 
            href="/admin/stories/new"
            className="flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors"
        >
            <Plus size={18} />
            <span>CREATE STORY</span>
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
      </div>

      {isLoading ? (
        <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 font-mono">Loading stories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.length === 0 && (
                <div className="col-span-full p-12 text-center text-gray-500 bg-[#111] border border-[#333] rounded-lg">
                    No stories found.
                </div>
            )}
            {filteredStories.map((story) => (
                <div key={story.id} className="bg-[#111] border border-[#333] rounded-lg overflow-hidden group hover:border-primary/50 transition-colors flex flex-col">
                    <div className="h-40 bg-[#222] relative overflow-hidden">
                        {story.cover_url ? (
                            <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                <BookOpen size={48} />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                            <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase border backdrop-blur-sm ${story.is_published ? 'bg-green-900/50 border-green-500/50 text-green-400' : 'bg-gray-900/50 border-gray-500/50 text-gray-400'}`}>
                                {story.is_published ? 'Published' : 'Draft'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-bold text-white text-xl mb-2">{story.title}</h3>
                        <p className="text-sm text-gray-400 mb-6 line-clamp-3 flex-1">{story.synopsis}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-[#222]">
                            <div className="flex items-center gap-2">
                                <Link href={`/admin/stories/${story.id}`} className="p-2 hover:bg-[#222] rounded text-gray-400 hover:text-white" title="Edit">
                                    <Edit size={18} />
                                </Link>
                                <button 
                                    onClick={() => handleToggleStatus(story)}
                                    className="p-2 hover:bg-[#222] rounded text-gray-400 hover:text-white"
                                    title={story.is_published ? "Unpublish" : "Publish"}
                                >
                                    {story.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button 
                                    onClick={() => handleDelete(story.id)}
                                    className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <Link href={`/stories/${story.id}`} target="_blank" className="text-xs font-mono text-primary hover:underline">
                                PREVIEW
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}

