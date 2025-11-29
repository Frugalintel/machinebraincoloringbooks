"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";

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
                <div key={story.id} className="bg-[#111] border border-[#333] rounded-lg p-6 relative group hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-primary border border-[#333]">
                            <BookOpen size={24} />
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/stories/${story.id}`} className="p-2 hover:bg-[#222] rounded text-gray-400 hover:text-white">
                                <Edit size={16} />
                            </Link>
                            <button 
                                onClick={() => handleDelete(story)}
                                className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <h3 className="font-bold text-white text-lg mb-1">{story.title}</h3>
                    <p className="text-sm text-gray-400 mb-4 h-16 overflow-hidden line-clamp-3">{story.synopsis}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-[#222] text-xs font-mono text-gray-500 uppercase tracking-wider">
                        <span>Nodes: {story.content?.length || 0}</span>
                        <span className={story.is_published ? 'text-green-500' : 'text-gray-500'}>
                            {story.is_published ? 'Published' : 'Draft'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
