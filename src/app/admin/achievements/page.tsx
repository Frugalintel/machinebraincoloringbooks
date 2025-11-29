"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Achievement } from "@/lib/types";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Trophy, Brush, Star, Zap, Code, Lock } from "lucide-react";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";

// Helper to map icon string to component
const getIconComponent = (iconName: string) => {
    switch(iconName) {
        case 'brush': return <Brush size={24} />;
        case 'star': return <Star size={24} />;
        case 'zap': return <Zap size={24} />;
        case 'code': return <Code size={24} />;
        case 'lock': return <Lock size={24} />;
        case 'trophy':
        default: return <Trophy size={24} />;
    }
};

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setAchievements(data);
        }
    } catch (error) {
        console.error("Error fetching achievements:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (achievement: Achievement) => {
      if (!confirm("Are you sure you want to delete this achievement?")) return;

      try {
          const { error } = await supabase.from('achievements').delete().eq('id', achievement.id);
          if (error) throw error;
          
          await logAdminAction(
              'delete_achievement',
              'achievements',
              achievement.id,
              { title: achievement.title }
          );

          setAchievements(achievements.filter(p => p.id !== achievement.id));
          success("Achievement deleted successfully.");
      } catch (err) {
          toastError("Failed to delete achievement.");
          console.error(err);
      }
  };

  const filteredAchievements = achievements.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-heading font-bold mb-1">ACHIEVEMENTS</h2>
            <p className="text-gray-500 font-mono text-sm">Manage unlockable player badges.</p>
        </div>
        <Link 
            href="/admin/achievements/new"
            className="flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors"
        >
            <Plus size={18} />
            <span>ADD ACHIEVEMENT</span>
        </Link>
      </div>

      <div className="bg-[#111] border border-[#333] p-4 rounded-lg flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Search achievements..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded py-2 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
            />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 font-mono">Loading achievements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.length === 0 && (
                <div className="col-span-full p-12 text-center text-gray-500 bg-[#111] border border-[#333] rounded-lg">
                    No achievements found.
                </div>
            )}
            {filteredAchievements.map((achievement) => (
                <div key={achievement.id} className="bg-[#111] border border-[#333] rounded-lg p-6 relative group hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-primary border border-[#333]">
                            {getIconComponent(achievement.icon)}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/achievements/${achievement.id}`} className="p-2 hover:bg-[#222] rounded text-gray-400 hover:text-white">
                                <Edit size={16} />
                            </Link>
                            <button 
                                onClick={() => handleDelete(achievement)}
                                className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <h3 className="font-bold text-white text-lg mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-400 mb-4 h-10 overflow-hidden">{achievement.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-[#222] text-xs font-mono text-gray-500 uppercase tracking-wider">
                        <span>Type: {achievement.trigger_type?.replace('_', ' ')}</span>
                        <span>Target: {achievement.target_value}</span>
                    </div>
                    
                    {achievement.is_secret && (
                        <div className="absolute top-4 right-4 px-2 py-1 bg-purple-900/30 text-purple-400 text-[10px] font-mono uppercase tracking-widest rounded border border-purple-900/50">
                            Secret
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
