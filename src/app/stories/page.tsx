"use client";

import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { Lock, Unlock, Terminal, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Story, UserStoryProgress } from "@/lib/types";
import { CodeEntry } from "@/components/code-entry";

export default function StoriesPage() {
  const { addItem, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [userProgress, setUserProgress] = useState<UserStoryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [productIds, setProductIds] = useState<Record<string, string>>({});

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Stories
      const { data: storyData } = await supabase
        .from('stories')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: true });
      
      if (storyData) {
        // Deduplicate stories by ID just in case
        const uniqueStories = Array.from(new Map(storyData.map(s => [s.id, s])).values());
        setStories(uniqueStories as Story[]);
        
        // Map requirements to get product IDs (for "Buy Book" link)
        const reqProductNames = storyData
          .map(s => s.requirements?.find((r: any) => r.type === 'product')?.name)
          .filter(Boolean);
        
        if (reqProductNames.length > 0) {
          const { data: prodData } = await supabase
            .from('products')
            .select('id, title')
            .in('title', reqProductNames);
          
          if (prodData) {
            const map: Record<string, string> = {};
            prodData.forEach((p: any) => map[p.title] = p.id);
            setProductIds(map);
          }
        }
      }

      // 2. Fetch User Progress from database (if logged in)
      if (user?.id) {
        const { data: progData, error } = await supabase
          .from('user_story_progress')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching story progress:', error);
        }
        
        if (progData) {
          setUserProgress(progData as UserStoryProgress[]);
        }
      } else {
        setUserProgress([]);
      }

    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStories();
    
    // Listen for story unlock events
    const handleStoryUnlocked = () => {
      fetchStories();
    };
    window.addEventListener('story-unlocked', handleStoryUnlocked);
    
    return () => {
      window.removeEventListener('story-unlocked', handleStoryUnlocked);
    };
  }, [fetchStories]);

  const isStoryUnlocked = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return false;

    // If story has no requirements AND no code_needed, it's unlocked by default
    const hasRequirements = story.requirements && story.requirements.length > 0;
    const hasCodeNeeded = story.code_needed && story.code_needed.trim() !== "";
    
    if (!hasRequirements && !hasCodeNeeded) return true;

    // Check if user has progress record in database
    return userProgress.some(p => p.story_id === storyId);
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black">
      <Navbar />
      
      {/* Header Banner */}
      <div className="bg-[#111] border-b border-[#333] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-6 text-primary font-mono uppercase tracking-widest text-xs">
              <Terminal size={14} />
              <span>Secure Archives // Clearance Level 1</span>
            </div>
            <h1 className="font-heading text-6xl md:text-8xl font-bold text-white mb-6 uppercase tracking-tighter leading-none">
              Story Archives
            </h1>
            <p className="font-mono text-sm text-gray-400 tracking-widest uppercase max-w-2xl leading-relaxed">
              These are <span className="text-primary">bonus interactive narratives</span> unlocked by secret codes hidden within our physical coloring books. 
              Find the code, initialize the sequence, and color pages to progress the story.
            </p>
          </div>

          {/* Quick Code Entry */}
          <div className="w-full md:w-auto md:min-w-[400px]">
            <p className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-widest text-center md:text-right">Have a code?</p>
            <CodeEntry />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story, index) => {
              const unlocked = isStoryUnlocked(story.id);
              // Simple genre parsing or default
              const tags = ["Sci-Fi"]; // Default, can be dynamic later if added to DB
              if (story.title.includes("Frozen") || story.title.includes("Holiday")) tags.push("Holiday");
              
              // Find required product name for fallback link
              const requiredProduct = story.requirements?.find((r: any) => r.type === 'product')?.name;
              const requiredProductId = requiredProduct ? productIds[requiredProduct] : null;
              
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative flex flex-col border ${unlocked ? "border-[#333] hover:border-primary/50" : "border-[#222] opacity-70"} bg-[#0a0a0a] transition-all duration-500 h-full overflow-hidden`}
                >
                  {/* Decorative Corner Accents */}
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${unlocked ? "border-primary/30 group-hover:border-primary" : "border-[#333]"} transition-colors duration-500`}></div>
                  <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${unlocked ? "border-primary/30 group-hover:border-primary" : "border-[#333]"} transition-colors duration-500`}></div>

                  {/* Status Bar */}
                  <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#111] relative z-10">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Terminal size={10} /> File: {story.id.slice(0, 8).toUpperCase()}
                    </span>
                    {unlocked ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-mono uppercase tracking-widest">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Lock size={10} />
                        <span className="text-[10px] font-mono uppercase tracking-widest">Encrypted</span>
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="p-8 flex-1 flex flex-col relative">
                    {/* Background Texture & Scanlines */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    <div className="mb-8 relative z-10">
                      {/* Tags Row */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {tags.map(tag => (
                          <span key={tag} className={`inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors
                            ${tag === "Holiday" 
                              ? "text-red-500 border-red-900/40 bg-red-900/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
                              : unlocked 
                                ? "text-primary border-primary/20 bg-primary/5" 
                                : "text-gray-600 border-gray-800"
                            }`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <h3 className="font-heading text-4xl text-white uppercase tracking-wide mb-4 leading-[0.9] group-hover:text-primary transition-colors duration-300 drop-shadow-md">
                        {story.title}
                      </h3>
                      <p className="text-gray-400 font-sans text-sm leading-relaxed mb-6 line-clamp-3 group-hover:text-gray-300 transition-colors">
                        {story.synopsis}
                      </p>
                    </div>

                    <div className="mt-auto relative z-10">
                      {unlocked ? (
                        <Link href={`/stories/${story.id}`} className="block">
                          <Button className="w-full bg-white text-black hover:bg-primary hover:text-black font-heading uppercase tracking-widest text-sm h-14 rounded-none transition-all flex justify-between items-center px-6">
                            <span>Access File</span>
                            <ArrowRight size={16} />
                          </Button>
                        </Link>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="text-[10px] text-gray-500 font-mono text-center">
                            Hidden Code Required from <span className="text-gray-300">{requiredProduct || "Archives"}</span>
                          </div>
                          <div className="flex gap-3 relative group/buy">
                            <Button disabled className="flex-1 bg-[#151515] text-gray-600 border border-[#222] font-mono uppercase tracking-widest text-xs h-14 rounded-none cursor-not-allowed group-hover/buy:border-primary/30 group-hover/buy:text-primary/70 transition-colors duration-500">
                              <div className="relative w-4 h-4 mr-2 flex items-center justify-center">
                                <Lock size={14} className="absolute inset-0 transition-all duration-500 ease-out group-hover/buy:opacity-0 group-hover/buy:scale-75 group-hover/buy:rotate-12" />
                                <Unlock size={14} className="absolute inset-0 transition-all duration-500 ease-out opacity-0 scale-75 -rotate-12 group-hover/buy:opacity-100 group-hover/buy:scale-100 group-hover/buy:rotate-0" />
                              </div>
                              <span className="relative w-24 text-center">
                                <span className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out group-hover/buy:opacity-0 group-hover/buy:translate-y-2">Locked</span>
                                <span className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out opacity-0 -translate-y-2 group-hover/buy:opacity-100 group-hover/buy:translate-y-0">Unlockable</span>
                              </span>
                            </Button>
                            
                            {requiredProductId ? (
                              <Link href={`/store/${requiredProductId}`} className="flex-1">
                                <Button 
                                  className="w-full bg-white text-black hover:bg-primary hover:text-black font-heading uppercase tracking-widest text-[10px] h-14 rounded-none transition-all duration-300 group/btn border border-white hover:border-primary flex flex-col items-center justify-center leading-tight py-1"
                                >
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <ShoppingCart size={12} className="transition-transform duration-300 group-hover/btn:scale-110" /> 
                                    <span className="font-bold">BUY BOOK</span>
                                  </div>
                                  <span className="text-[8px] font-mono opacity-60 normal-case tracking-normal transition-opacity duration-300 group-hover/btn:opacity-100">
                                    Find the Code
                                  </span>
                                </Button>
                              </Link>
                            ) : (
                              <Button disabled className="flex-1 bg-[#222] text-gray-500 border border-[#333] font-mono uppercase tracking-widest text-[10px] h-14 rounded-none cursor-not-allowed">
                                Unavailable
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
