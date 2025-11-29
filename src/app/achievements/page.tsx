"use client";

import { Navbar } from "@/components/navbar";
import { useGame } from "@/context/game-context";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Terminal, Lock, CheckCircle, PlusCircle, AlertCircle, RefreshCw, ArrowUpDown, ArrowDownAZ, LayoutList, ArrowLeft, ExternalLink, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

// Icons map for achievements
const iconMap: Record<string, React.ReactNode> = {
    "brush": <Star className="w-5 h-5" />,
    "trophy": <Trophy className="w-5 h-5" />,
    "zap": <Zap className="w-5 h-5" />,
    "star": <Star className="w-5 h-5" />,
    "code": <Terminal className="w-5 h-5" />
};

export default function AchievementsPage() {
    const { user, openAuthModal } = useAuth();
    const { achievements, collectionSets, activeAchievementIds, toggleActiveAchievement, resetGameData } = useGame();
    const router = useRouter();
    const [sortMethod, setSortMethod] = useState<'default' | 'name' | 'status'>('default');

    const isFull = activeAchievementIds.length >= 5;

    const handleViewCollectible = () => {
        // In a real app we would link to specific collectible ID, 
        // but for now we just go to the public gallery which directs to trophy room if logged in.
        // Or we can direct straight to trophy room since they are logged in here.
        router.push("/trophy-room");
    };

    if (!user) {
         return (
            <main className="min-h-screen bg-black text-white font-sans flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <Lock className="w-12 h-12 text-gray-500 mx-auto" />
                        <h1 className="text-2xl font-heading uppercase">Restricted Access</h1>
                        <Button onClick={() => openAuthModal('login')} className="bg-primary text-black hover:bg-white uppercase tracking-widest">
                            Login Required
                        </Button>
                    </div>
                </div>
            </main>
         );
    }

    const sortedAchievements = [...achievements].sort((a, b) => {
        if (sortMethod === 'name') {
            return a.title.localeCompare(b.title);
        }
        if (sortMethod === 'status') {
             // Logic: Active < Incomplete < Completed
             // Check active status
             const aActive = activeAchievementIds.includes(a.id);
             const bActive = activeAchievementIds.includes(b.id);
             if (aActive && !bActive) return -1;
             if (!aActive && bActive) return 1;

             // Check completed status (unlocked)
             if (!a.unlocked && b.unlocked) return -1; // Incomplete before completed
             if (a.unlocked && !b.unlocked) return 1;

             // Tie-breaker: ID
             return a.id.localeCompare(b.id);
        }
        return 0; // Default (preserve order or by ID if needed)
    });

    // Helper to check if an achievement is related to a collection set
    // For now we check if "collectible" is in description or similar, 
    // OR we can add explicit links in game-data if needed.
    // Let's search description for "collectible set" as a simple heuristic or check specific IDs.
    // Better: Reverse lookup from collectionSets items.
    const getRelatedCollectible = (achId: string) => {
        for (const set of collectionSets) {
            for (const item of set.items) {
                if (item.relatedAchievementId === achId) {
                    return item;
                }
            }
        }
        // Also check generic "Collection Hunter" or similar if we want to link general sets
        if (achId === "ach-02") return { name: "Any Set", image: "bg-gray-500" }; 
        return null;
    };

    return (
        <main className="min-h-screen bg-black text-white font-sans">
            <Navbar />
            
            {/* Header */}
            <div className="bg-[#111] border-b border-[#333] py-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="mb-6">
                        <Link href="/profile/me">
                            <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary text-gray-500 font-mono text-xs uppercase tracking-widest transition-colors">
                                <ArrowLeft size={14} className="mr-2" /> Back to Profile
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
                                <Trophy size={14} />
                                <span>Achievement Database // Global</span>
                            </div>
                            <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-2 uppercase tracking-tighter">
                                Mission Control
                            </h1>
                            <p className="font-mono text-sm text-gray-500 tracking-widest uppercase max-w-xl">
                                Select up to 5 active missions to track on your profile.
                            </p>
                        </div>
                        
                        {/* Status Monitor & Reset */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-black border border-[#333] p-4 flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Active Slots</p>
                                    <p className={`font-heading text-2xl ${isFull ? "text-red-500" : "text-primary"}`}>
                                        {activeAchievementIds.length} / 5
                                    </p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${isFull ? "bg-red-500 animate-pulse" : "bg-green-500"}`}></div>
                            </div>
                            <Button 
                                onClick={resetGameData} 
                                variant="outline" 
                                className="border border-red-900 text-red-500 hover:bg-red-900 hover:text-white text-[10px] uppercase tracking-widest"
                            >
                                <RefreshCw size={12} className="mr-2" /> Reset Data
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-12">
                
                {/* Active Loadout Preview (Sticky-ish) */}
                <div className="mb-12 sticky top-20 z-30 bg-black/80 backdrop-blur-md border border-[#333] p-6 shadow-2xl">
                    <h3 className="font-heading text-xl text-white uppercase mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-primary" /> Active Loadout
                    </h3>
                    <div className="grid grid-cols-5 gap-4">
                        {[0, 1, 2, 3, 4].map((i) => {
                            const activeId = activeAchievementIds[i];
                            const ach = achievements.find(a => a.id === activeId);
                            
                            return (
                                <div key={i} className={`aspect-square md:aspect-auto md:h-24 border ${ach ? "border-primary/50 bg-[#151515]" : "border-[#222] border-dashed bg-transparent"} flex flex-col items-center justify-center relative group`}>
                                    {ach ? (
                                        <>
                                            <div className="text-primary mb-2 scale-75 md:scale-100">{iconMap[ach.icon]}</div>
                                            <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase text-center leading-tight px-1 hidden md:block">{ach.title}</span>
                                            <button 
                                                onClick={() => toggleActiveAchievement(ach.id)}
                                                className="absolute inset-0 bg-red-900/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center uppercase font-bold text-[10px] tracking-widest transition-opacity"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-gray-700 uppercase font-mono">Empty</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sort Controls */}
                <div className="flex gap-4 mb-8">
                     <Button 
                        variant={sortMethod === 'default' ? 'default' : 'outline'} 
                        onClick={() => setSortMethod('default')}
                        className={`text-[10px] uppercase tracking-widest h-8 ${sortMethod === 'default' ? 'bg-primary text-black' : 'border-[#333] text-gray-500'}`}
                    >
                         <ArrowUpDown size={12} className="mr-2" /> Default
                     </Button>
                     <Button 
                        variant={sortMethod === 'name' ? 'default' : 'outline'}
                        onClick={() => setSortMethod('name')}
                        className={`text-[10px] uppercase tracking-widest h-8 ${sortMethod === 'name' ? 'bg-primary text-black' : 'border-[#333] text-gray-500'}`}
                    >
                         <ArrowDownAZ size={12} className="mr-2" /> Name
                     </Button>
                     <Button 
                        variant={sortMethod === 'status' ? 'default' : 'outline'}
                        onClick={() => setSortMethod('status')}
                        className={`text-[10px] uppercase tracking-widest h-8 ${sortMethod === 'status' ? 'bg-primary text-black' : 'border-[#333] text-gray-500'}`}
                    >
                         <LayoutList size={12} className="mr-2" /> Status
                     </Button>
                </div>

                {/* All Achievements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedAchievements.map((ach) => {
                        const isActive = activeAchievementIds.includes(ach.id);
                        const canAdd = !isActive && !isFull;
                        const relatedCollectible = getRelatedCollectible(ach.id);
                        const isHoliday = (ach as any).type === "holiday";
                        
                        return (
                            <div 
                                key={ach.id} 
                                id={ach.id}
                                className={`
                                    border p-6 relative group transition-all duration-300 flex flex-col scroll-mt-32
                                    ${isActive ? "border-primary bg-[#111] shadow-[0_0_15px_rgba(255,79,0,0.1)]" : "border-[#333] bg-[#0a0a0a] hover:border-gray-600"}
                                    ${ach.unlocked ? "opacity-50 grayscale" : ""} 
                                `}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 flex items-center justify-center border ${ach.unlocked ? "border-white/20 text-white/50" : (isActive ? "border-primary text-primary" : isHoliday ? "border-red-500/50 text-red-500" : "border-[#333] text-gray-500")}`}>
                                        {iconMap[ach.icon]}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {isHoliday && (
                                            <span className="bg-red-900/10 text-red-500 text-[8px] px-2 py-1 uppercase tracking-widest font-mono border border-red-900/30 flex items-center gap-1">
                                                Holiday
                                            </span>
                                        )}
                                        
                                        {ach.unlocked ? (
                                             <span className="bg-[#222] text-white text-[10px] px-2 py-1 uppercase tracking-widest font-mono border border-white/10">
                                                Completed
                                             </span>
                                        ) : isActive ? (
                                            <span className="bg-primary text-black text-[10px] px-2 py-1 uppercase tracking-widest font-bold flex items-center gap-1 animate-pulse">
                                                <Zap size={10} fill="currentColor" /> Active
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <h4 className={`font-heading text-lg uppercase mb-2 ${isActive ? "text-white" : "text-gray-400"}`}>
                                    {ach.title}
                                </h4>
                                <p className="text-xs text-gray-500 font-mono mb-6 uppercase tracking-wide min-h-8">
                                    {ach.description}
                                </p>

                                {relatedCollectible && (
                                    <div className="mb-4 p-2 border border-[#333] bg-[#151515] flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${relatedCollectible.image} opacity-50`}></div>
                                        <div>
                                            <p className="text-[8px] text-gray-500 uppercase tracking-widest">Reward Item</p>
                                            <p className="text-[10px] text-white font-mono uppercase">{relatedCollectible.name}</p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleViewCollectible}
                                            className="ml-auto h-6 w-6 p-0 hover:text-primary"
                                        >
                                            <ExternalLink size={12} />
                                        </Button>
                                    </div>
                                )}

                                <div className="mt-auto">
                                    {!ach.unlocked && (
                                        <Button 
                                            onClick={() => toggleActiveAchievement(ach.id)}
                                            disabled={!isActive && isFull}
                                            className={`w-full h-10 rounded-none text-[10px] uppercase tracking-[0.2em] font-bold border transition-all
                                                ${isActive 
                                                    ? "bg-transparent border-red-900 text-red-500 hover:bg-red-900 hover:text-white" 
                                                    : "bg-[#1a1a1a] border-[#333] text-white hover:bg-primary hover:text-black hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                }
                                            `}
                                        >
                                            {isActive ? "Deactivate" : (isFull ? "Slots Full" : "Activate Mission")}
                                        </Button>
                                    )}
                                    
                                    {ach.unlocked && (
                                         <div className="w-full h-10 flex items-center justify-center text-[10px] uppercase tracking-widest text-green-500 font-mono border border-green-900/30 bg-green-900/10">
                                             <CheckCircle size={12} className="mr-2" /> Mission Complete
                                         </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
