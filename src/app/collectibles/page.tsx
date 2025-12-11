"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Box, Lock, Info, ArrowRight, UserPlus, ExternalLink, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { collectionSets, achievements } from "@/lib/game-data";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";

// Dynamic import for 3D trophy canvas
const TrophyCanvas = dynamic(
  () => import('@/components/three').then((m) => m.TrophyCanvas),
  { ssr: false }
);

export default function CollectiblesPublicPage() {
    const { user, openAuthModal } = useAuth();
    const { collectionSets: userCollectionSets, collectibleTimestamps } = useGame();
    const [hoveredItem, setHoveredItem] = useState<{ id: string; name: string } | null>(null);
    const router = useRouter();

    // Get all unlocked collectibles with their data
    const unlockedCollectibles = useMemo(() => {
        const unlocked: Array<{ id: string; name: string; rarity: string; setId: string; unlockedAt?: string }> = [];
        userCollectionSets.forEach(set => {
            set.items.forEach(item => {
                if (set.collected.includes(item.id)) {
                    unlocked.push({
                        id: item.id,
                        name: item.name,
                        rarity: item.rarity,
                        setId: set.id,
                        unlockedAt: collectibleTimestamps[item.id]?.unlockedAt,
                    });
                }
            });
        });
        return unlocked.sort((a, b) => {
            if (!a.unlockedAt) return 1;
            if (!b.unlockedAt) return -1;
            return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
        });
    }, [userCollectionSets, collectibleTimestamps]);

    // Most recently unlocked collectible
    const recentCollectible = unlockedCollectibles[0];

    // Helper to check if an item is collected by the current user
    const isItemCollected = (itemId: string) => {
        return userCollectionSets.some(set => set.collected.includes(itemId));
    };

    const handleViewMission = (achId: string) => {
        if (!user) {
            openAuthModal('login');
            return;
        }
        
        // If we wanted to automatically add it to loadout:
        // toggleActiveAchievement(achId); 
        // But user said "link to the achievements page so you can easily add it"
        // So we just navigate there.
        // Ideally we could pass a query param to highlight it or filter by it, but simple nav is MVP.
        router.push("/achievements");
    };

    return (
        <main className="min-h-screen bg-black text-white font-sans">
            
            {/* Hero Section */}
            <div className="bg-[#111] border-b border-[#333] py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                {/* Abstract Background Element */}
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

                <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                            {/* Featured Trophy Preview - show recent unlock if user is logged in and has collectibles */}
                            {user && recentCollectible && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="w-40 h-40 bg-[#0a0a0a] border border-[#333] relative overflow-hidden flex-shrink-0"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-amber-500 to-transparent"></div>
                                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 text-primary font-mono text-[8px] uppercase tracking-widest">
                                        <Sparkles size={8} />
                                        <span>Recent</span>
                                    </div>
                                    <TrophyCanvas 
                                        size="small" 
                                        rarity={recentCollectible.rarity} 
                                        autoRotate={true}
                                        isInteractive={false}
                                        unlockedAt={recentCollectible.unlockedAt}
                                        lastPolishedAt={collectibleTimestamps[recentCollectible.id]?.lastPolishedAt}
                                    />
                                </motion.div>
                            )}
                            
                            <div>
                                <h1 className="font-heading text-6xl md:text-8xl font-bold text-white mb-6 uppercase tracking-tighter">
                                    Digital <span className="text-primary">Artifacts</span>
                                </h1>
                                <p className="font-mono text-sm md:text-base text-gray-400 tracking-widest uppercase max-w-2xl mx-auto mb-10 leading-relaxed">
                                    Discover rare collectibles hidden across the Machine Brain universe. 
                                    Unlock them by completing achievements, entering secret codes, or submitting masterpiece colorings.
                                </p>
                            </div>
                        </div>
                        
                        {!user ? (
                            <Button 
                                onClick={() => openAuthModal('register')}
                                className="bg-white text-black hover:bg-primary hover:text-black font-heading uppercase tracking-widest px-8 py-6 rounded-none text-lg transition-all transform hover:scale-105"
                            >
                                <UserPlus className="mr-2" size={20} /> Start Collecting
                            </Button>
                        ) : (
                             <Link href="/trophy-room">
                                <Button 
                                    className="bg-primary text-black hover:bg-white hover:text-black font-heading uppercase tracking-widest px-8 py-6 rounded-none text-lg"
                                >
                                    Go to Trophy Room <ArrowRight className="ml-2" size={20} />
                                </Button>
                            </Link>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="container mx-auto px-4 md:px-6 py-20">
                {collectionSets.map((set, setIndex) => (
                    <div key={set.id} className="mb-24 last:mb-0">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[#333] pb-4">
                            <div>
                                <span className="text-primary font-mono text-xs uppercase tracking-[0.2em] mb-2 block">Collection Series {setIndex + 1}</span>
                                <h2 className="font-heading text-4xl text-white uppercase">{set.title}</h2>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Total Artifacts</p>
                                <p className="font-heading text-2xl">{set.total}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {set.items.map((item) => {
                                const relatedAch = item.relatedAchievementId ? achievements.find(a => a.id === item.relatedAchievementId) : null;

                                return (
                                    <Link href={`/collectibles/${item.id}`} key={item.id} className="block h-full">
                                    <motion.div 
                                        whileHover={{ y: -5 }}
                                        onHoverStart={() => setHoveredItem(item)}
                                        onHoverEnd={() => setHoveredItem(null)}
                                        className="group relative bg-[#0a0a0a] border border-[#333] p-6 hover:border-primary/50 transition-colors overflow-hidden flex flex-col h-full"
                                    >
                                        {/* Item Preview */}
                                        <div className="aspect-square bg-[#151515] mb-6 relative flex items-center justify-center overflow-hidden border border-[#222] group-hover:border-primary/20 flex-shrink-0">
                                            {isItemCollected(item.id) ? (
                                                <>
                                                    <div className="w-full h-full">
                                                        <TrophyCanvas 
                                                            size="small" 
                                                            rarity={item.rarity} 
                                                            autoRotate={true} 
                                                            isInteractive={false}
                                                            unlockedAt={collectibleTimestamps[item.id]?.unlockedAt}
                                                            lastPolishedAt={collectibleTimestamps[item.id]?.lastPolishedAt}
                                                        />
                                                    </div>
                                                    {/* Collected badge */}
                                                    <div className="absolute top-2 right-2 z-10 bg-primary/90 text-black px-2 py-1 font-mono text-[8px] uppercase tracking-widest">
                                                        Collected
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={`w-24 h-24 rounded-full ${item.image} blur-2xl opacity-40 absolute group-hover:opacity-60 transition-opacity`}></div>
                                                    <Box className="w-12 h-12 text-gray-300 relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
                                                </>
                                            )}
                                            
                                            {/* Overlay Info on Hover - Simplified to just show it's interactive if there's detailed data */}
                                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 text-center pointer-events-none">
                                                <p className="text-[10px] text-primary uppercase tracking-widest font-mono mb-2">View Details</p>
                                                <p className="text-xs text-white font-mono leading-relaxed">Click to inspect artifact</p>
                                            </div>
                                        </div>

                                        {/* Info & Action Area */}
                                        <div className="flex-1 flex flex-col">
                                            <h3 className="font-heading text-xl text-white uppercase mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
                                            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest mb-4">
                                                {isItemCollected(item.id) ? (
                                                    <span className="text-primary flex items-center gap-2">
                                                        <Trophy size={12} /> Owned
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 flex items-center gap-2">
                                                        <Lock size={12} /> Locked
                                                    </span>
                                                )}
                                            </div>

                                            {/* Expanded Details Area (Always visible if related achievement exists, or just cleaner layout) */}
                                            {relatedAch ? <div className="mt-auto pt-4 border-t border-[#333]">
                                                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                                                        <Trophy size={12} className="text-primary" />
                                                        <span className="text-[10px] font-mono uppercase tracking-wide">Linked Mission</span>
                                                    </div>
                                                    <p className="text-xs text-gray-300 font-mono mb-3 line-clamp-2">{relatedAch.description}</p>
                                                </div> : null}
                                        </div>
                                        
                                        {/* Decorative Corner */}
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#333] group-hover:border-primary/50 transition-colors pointer-events-none"></div>
                                    </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* CTA Footer */}
            {!user && (
                <div className="bg-primary/10 border-t border-[#333] py-20 text-center">
                    <div className="container mx-auto px-4">
                        <h2 className="font-heading text-3xl md:text-5xl text-white uppercase mb-6">Begin Your Collection</h2>
                        <p className="text-gray-400 font-mono text-sm max-w-xl mx-auto mb-8 uppercase tracking-widest">
                            Join Machine Brain today to start unlocking artifacts, earning achievements, and building your legacy.
                        </p>
                        <Button 
                            onClick={() => openAuthModal('register')}
                            className="bg-primary text-black hover:bg-white font-heading uppercase tracking-widest px-10 py-6 rounded-none text-xl"
                        >
                            Create Account
                        </Button>
                    </div>
                </div>
            )}
        </main>
    );
}
