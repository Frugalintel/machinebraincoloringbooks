"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Unlock, ChevronDown, ShoppingCart, Play, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";

export function StoriesSection() {
  const { user, openAuthModal } = useAuth();
  const { addItem, setIsCartOpen } = useCart();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [productIds, setProductIds] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStories = async () => {
        const { data: storyData } = await supabase
            .from('stories')
            .select('*')
            .eq('is_published', true)
            .limit(3);
        
        if (storyData) {
            setStories(storyData as Story[]);
            
            // Map requirements to get product IDs
            const reqProductNames = storyData
                .map(s => s.requirements.find(r => r.type === 'product')?.name)
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
    };
    fetchStories();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleQuickAdd = (e: React.MouseEvent, story: any) => {
      e.stopPropagation();
      const productId = productIds[story.initialArtifact];
      if (!productId) return; // Can't add if no ID found

      addItem({ 
          id: productId, 
          title: "Book", 
          subtitle: story.initialArtifact,
          price: story.price 
      });
      setIsCartOpen(true);
  };

  return (
    <section className="w-full h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-8 w-4 bg-primary"></div>
        <h2 className="font-heading text-5xl md:text-6xl font-bold tracking-tighter text-white">
          STORY MODE
        </h2>
      </div>

      {/* Main Card */}
      <div className="flex-1 border border-[#333] bg-[#0a0a0a] relative group overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col">
         
         {/* Background Grid - Global */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
         </div>

         {/* Content Wrapper */}
         <div className="relative z-10 flex flex-col h-full">
            
            {/* Top: Status Bar */}
            <div className="w-full border-b border-[#333] bg-[#111] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-[10px] text-green-500 uppercase tracking-widest">Archive Online</span>
                </div>
                <div className="flex gap-4">
                    <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest hidden md:inline">Top Rated This Month</span>
                </div>
            </div>

            {/* Middle: Data Logs List (Fills available space) */}
            <div className="flex-1 relative p-6 md:p-10 flex flex-col justify-start gap-4 overflow-y-auto">
                
                {stories.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 font-mono text-sm uppercase tracking-widest">
                        Loading Archives...
                    </div>
                ) : (
                stories.map((story) => {
                    const isHoliday = story.title.includes("Holiday") || story.title.includes("Frozen");
                    const themeColor = isHoliday ? "text-red-500" : "text-primary";
                    const themeBorder = isHoliday ? "border-red-500" : "border-primary";
                    const themeBg = isHoliday ? "bg-red-500" : "bg-primary";
                    // Fallback hook since it's not in DB yet
                    const hook = story.synopsis || "A mysterious signal detected...";
                    // Parse initialArtifact from requirements or fallback
                    const initialArtifact = story.requirements?.find(r => r.type === 'product')?.name || "Archives";
                    // Mock price for now since it's not on story object directly, or fetch it
                    const price = 15.00; 

                    return (
                    <motion.div 
                        key={story.id}
                        layout
                        initial={false}
                        onClick={() => toggleExpand(story.id)}
                        className={`w-full border transition-all duration-300 relative overflow-hidden cursor-pointer
                            ${expandedId === story.id 
                                ? `bg-[#1a1a1a] ${isHoliday ? "border-red-500/50" : "border-primary/50"}` 
                                : `bg-[#151515] border-[#333] ${isHoliday ? "hover:border-red-500/30" : "hover:border-gray-500"}`
                            }
                        `}
                    >
                        {expandedId === story.id && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${themeBg}`}></div>
                        )}

                        <div className="p-4 flex items-center gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 border flex items-center justify-center shrink-0 transition-colors
                                ${expandedId === story.id 
                                    ? `bg-black ${themeBorder} ${themeColor}` 
                                    : "bg-black border-[#333] text-white"}
                            `}>
                                {/* Logic: Show Unlock if user is logged in (TODO: check progress). Otherwise show Lock. */}
                                {user ? ( // Simple check for now
                                    <Lock size={16} className={expandedId === story.id ? themeColor : "text-gray-600"} />
                                ) : (
                                    <Lock size={16} className={expandedId === story.id ? themeColor : "text-gray-600"} />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-heading text-xl uppercase tracking-wide truncate ${expandedId === story.id ? themeColor : "text-white"}`}>
                                                {story.title}
                                            </h4>
                                            {isHoliday && (
                                                <span className="text-[8px] font-mono text-red-500 uppercase tracking-widest border border-red-900/50 bg-red-900/10 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                                                    <Star size={6} fill="currentColor" /> Holiday
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border
                                            ${!user 
                                                ? "text-gray-500 border-gray-800 bg-[#111]" 
                                                : "text-gray-600 border-gray-800"
                                            }
                                        `}>
                                            LOCKED
                                        </span>
                                    </div>
                                <p className="text-xs text-gray-400 font-mono truncate">{story.synopsis}</p>
                            </div>

                            {/* Arrow */}
                            <div className={`w-8 h-8 flex items-center justify-center transition-transform duration-300 ${expandedId === story.id ? `rotate-180 ${themeColor}` : "text-gray-500"}`}>
                                <ChevronDown size={16} />
                            </div>
                        </div>

                        {/* Expanded Content: Teaser & Actions */}
                        <AnimatePresence>
                            {expandedId === story.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-6 pl-[4rem]">
                                        <div className="h-px w-full bg-[#333] mb-4"></div>
                                        
                                        {/* Teaser Text */}
                                        <div className={`bg-[#111] border-l-2 ${isHoliday ? "border-red-500/50" : "border-primary/50"} p-4 mb-6 relative`}>
                                            <p className="text-sm font-sans text-gray-300 italic leading-relaxed">
                                                "{hook}"
                                            </p>
                                        </div>

                                        {/* Action Area */}
                                        <div className="flex flex-col gap-3">
                                            {/* Step 1: Buy the Key */}
                                            <div className="flex flex-col bg-[#0a0a0a] border border-[#333] hover:border-gray-500 transition-colors relative group/card">
                                                {/* Top: Visual & Info */}
                                                <div className="flex items-center justify-between p-4 border-b border-[#222]">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isHoliday ? "bg-red-500" : "bg-primary"} animate-pulse`}></div>
                                                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Required Key</span>
                                                        </div>
                                                        <Link href={productIds[initialArtifact] ? `/store/${productIds[initialArtifact]}` : "#"} className={`text-sm font-heading uppercase tracking-wide text-white hover:${themeColor} transition-colors flex items-center gap-2`}>
                                                            {initialArtifact}
                                                            <ArrowRight size={12} className={`transition-transform duration-300 group-hover/card:translate-x-1 ${isHoliday ? "text-red-500" : "text-primary"}`} />
                                                        </Link>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-gray-600 line-through font-mono mb-0.5">${price.toFixed(2)}</span>
                                                        <span className="text-base font-heading text-white tracking-tight">${(price * 0.7).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {/* Bottom: Action */}
                                                <div className="p-2 bg-[#111]">
                                                    <Button 
                                                        size="sm" 
                                                        onClick={(e) => handleQuickAdd(e, { initialArtifact, price })}
                                                        className="w-full h-9 bg-white text-black hover:bg-primary hover:text-black border border-transparent text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex justify-between px-4"
                                                    >
                                                        <span>Purchase Key</span>
                                                        <ShoppingCart size={14} />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Step 2: Start */}
                                            <Link href="/stories">
                                                <Button 
                                                    variant="outline"
                                                    className={`w-full border-[#333] bg-[#1a1a1a] text-gray-400 hover:text-white hover:${isHoliday ? "border-red-500/50" : "border-primary/50"} hover:bg-[#222] font-mono text-xs h-10 rounded-none tracking-widest uppercase transition-all shadow-none`}
                                                >
                                                    I have the code <ArrowRight className="ml-2 w-3 h-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                    );
                }))}
            </div>

            {/* Bottom: Controls & Info */}
            <div className="border-t border-[#333] bg-[#111] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-lg">
                    <h3 className="font-heading text-2xl text-white uppercase tracking-wide flex items-center gap-2">
                        How It Works
                    </h3>
                    <p className="font-sans text-gray-400 text-sm leading-relaxed">
                        1. Acquire the physical coloring book. <br/>
                        2. Find the hidden access code on the back page. <br/>
                        3. Enter the code here to unlock the interactive story.
                    </p>
                </div>

                <div className="w-full md:w-auto">
                     <Link href="/stories" className="block w-full md:w-auto">
                        <Button className="w-full md:w-auto bg-primary text-black hover:bg-white border border-transparent font-heading text-lg h-14 px-8 rounded-none tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,79,0,0.3)] hover:shadow-none">
                            Enter Access Codes <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                    </Link>
                </div>
            </div>

         </div>
      </div>
    </section>
  );
}
