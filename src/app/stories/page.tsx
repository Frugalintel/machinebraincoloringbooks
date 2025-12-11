"use client";

import { Lock, Unlock, Terminal, ArrowRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Story, UserStoryProgress, StoryRequirement } from "@/lib/types";
import { CodeEntry } from "@/components/code-entry";
import { logger } from "@/lib/logger";

export default function StoriesPage() {
  const { addItem, setIsCartOpen } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [userProgress, setUserProgress] = useState<UserStoryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [productIds, setProductIds] = useState<Record<string, string>>({});
  const hasFetchedRef = useRef(false);

  // Fetch everything once when auth is ready
  useEffect(() => {
    // Only fetch once, when auth loading completes
    if (isAuthLoading || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchAllData = async () => {
      try {
        // 1. Fetch Stories
        const { data: storyData } = await supabase
          .from('stories')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: true });
        
        if (storyData) {
          const uniqueStories = Array.from(new Map(storyData.map(s => [s.id, s])).values());
          setStories(uniqueStories as Story[]);
          
          // Map requirements to get product IDs
          const reqProductNames = storyData
            .map((s: Story) => s.requirements?.find((r: StoryRequirement) => r.type === 'product')?.name)
            .filter(Boolean);
          
          if (reqProductNames.length > 0) {
            const { data: prodData } = await supabase
              .from('products')
              .select('id, title')
              .in('title', reqProductNames);
            
            if (prodData) {
              const map: Record<string, string> = {};
              prodData.forEach((p: { title: string; id: string }) => map[p.title] = p.id);
              setProductIds(map);
            }
          }
        }

        // 2. Fetch User Progress (if logged in)
        if (user?.id) {
          const { data: progData } = await supabase
            .from('user_story_progress')
            .select('*')
            .eq('user_id', user.id);
          
          if (progData) {
            setUserProgress(progData as UserStoryProgress[]);
          }
        }
      } catch (error) {
        logger.error("Error loading stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isAuthLoading, user?.id]);

  // Listen for story unlock events - only updates progress, not stories
  useEffect(() => {
    const handleStoryUnlocked = () => {
      if (user?.id) {
        supabase
          .from('user_story_progress')
          .select('*')
          .eq('user_id', user.id)
          .then(({ data }) => {
            if (data) setUserProgress(data as UserStoryProgress[]);
          });
      }
    };
    window.addEventListener('story-unlocked', handleStoryUnlocked);
    
    return () => {
      window.removeEventListener('story-unlocked', handleStoryUnlocked);
    };
  }, [user?.id]);

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
      
      {/* Header Banner */}
      <div className="bg-[#111] border-b border-[#222] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
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
              const tags = story.tags && story.tags.length > 0 ? story.tags : ["Sci-Fi"]; 
              if (story.title.includes("Frozen") || story.title.includes("Holiday")) tags.push("Holiday");
              
              // Find required product name for fallback link
              const requiredProduct = story.requirements?.find((r: StoryRequirement) => r.type === 'product')?.name;
              const requiredProductId = requiredProduct ? productIds[requiredProduct] : null;
              
              return (
                <div
                  key={story.id}
                  className={`group relative flex flex-col border ${unlocked ? "border-[#222] hover:border-primary/50" : "border-[#222] opacity-70"} bg-[#0a0a0a] transition-all duration-500 h-full overflow-hidden animate-in fade-in zoom-in-95 duration-300`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Decorative Corner Accents */}
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${unlocked ? "border-primary/30 group-hover:border-primary" : "border-[#222]"} transition-colors duration-500 z-20`}></div>
                  <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${unlocked ? "border-primary/30 group-hover:border-primary" : "border-[#222]"} transition-colors duration-500 z-20`}></div>

                  {/* Status Bar */}
                  <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#111] relative z-20">
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
                  <div className="p-8 flex-1 flex flex-col relative overflow-hidden">
                    {/* Background Image / Texture */}
                    {story.cover_url ? (
                        <>
                            <div className="absolute inset-0 z-0">
                                <img 
                                    src={story.cover_url} 
                                    alt={story.title}
                                    className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 ease-out grayscale group-hover:grayscale-0"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-0"></div>
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-5 pointer-events-none"></div>
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        </>
                    )}
                    
                    <div className="mb-8 relative z-10 flex flex-col gap-4">
                      {/* Tags & Metadata Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {tags.map((tag: string) => (
                          <span key={tag} className={`inline-block px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border transition-colors backdrop-blur-md rounded-sm
                            ${tag === "Holiday" 
                              ? "text-red-500 border-red-900/40 bg-red-900/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
                              : unlocked 
                                ? "text-primary border-primary/20 bg-black/40" 
                                : "text-gray-500 border-gray-800 bg-black/40"
                            }`}>
                            {tag}
                          </span>
                        ))}
                        
                        {/* New Metadata Chips */}
                        {story.difficulty ? <span className="flex items-center gap-1 text-[9px] font-mono text-gray-400 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-sm border border-gray-800">
                                {Array.from({length: 5}).map((_, i) => (
                                    <span key={i} className={i < (story.difficulty || 1) ? "text-primary" : "text-gray-700"}>★</span>
                                ))}
                            </span> : null}
                        {story.estimated_minutes ? <span className="text-[9px] font-mono text-gray-400 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-sm border border-gray-800">
                                {story.estimated_minutes} MIN
                            </span> : null}
                      </div>
                      
                      <h3 className="font-heading text-5xl text-white uppercase tracking-tighter leading-[0.85] group-hover:text-primary transition-colors duration-300 drop-shadow-xl">
                        {story.title}
                      </h3>
                      
                      <div className="bg-black/30 backdrop-blur-sm p-3 border border-white/5 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-gray-300 font-sans text-xs leading-relaxed line-clamp-3">
                            {story.synopsis}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto relative z-10 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                      {unlocked ? (
                        <Link href={`/stories/${story.id}`} className="block">
                          <Button className="w-full bg-white text-black hover:bg-primary hover:text-black font-heading uppercase tracking-widest text-sm h-12 rounded-none transition-all flex justify-between items-center px-6 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]">
                            <span>Initialize</span>
                            <ArrowRight size={16} />
                          </Button>
                        </Link>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {/* Locked state remains visible even without hover for clarity, but styled better */}
                          <div className="flex gap-2 relative group/buy">
                            <Button disabled className="flex-1 bg-black/60 backdrop-blur-md text-gray-500 border border-[#333] font-mono uppercase tracking-widest text-[10px] h-12 rounded-none cursor-not-allowed">
                              <Lock size={12} className="mr-2" /> Locked
                            </Button>
                            
                            {requiredProductId ? (
                              <Link href={`/store/${requiredProductId}`} className="flex-1">
                                <Button 
                                  className="w-full bg-white/90 text-black hover:bg-primary hover:text-black font-heading uppercase tracking-widest text-[10px] h-12 rounded-none transition-all duration-300 border border-transparent"
                                >
                                  <ShoppingCart size={12} className="mr-2" /> Buy Key
                                </Button>
                              </Link>
                            ) : (
                              <Button disabled className="flex-1 bg-[#222] text-gray-500 border border-[#222] font-mono uppercase tracking-widest text-[10px] h-12 rounded-none cursor-not-allowed">
                                Unavailable
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
