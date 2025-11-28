"use client";

import { Navbar } from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Trophy, Lock, Unlock, Scan, Box, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGame } from "@/context/game-context";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

export default function TrophyRoomPage() {
  const { user, openAuthModal } = useAuth();
  const { collectionSets, unlockItem } = useGame();
  const [code, setCode] = useState("");
  const [unlockedReward, setUnlockedReward] = useState<string | null>(null);

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toLowerCase() === "dog") {
        const targetSet = collectionSets.length > 0 ? collectionSets[0] : null;
        if (!targetSet) return;

        const targetItemId = "quantum-bulldog";

        if (!targetSet.collected.includes(targetItemId)) {
            unlockItem(targetSet.id, targetItemId);
            setUnlockedReward(targetSet.reward);
        } else {
             alert("ITEM ALREADY ACQUIRED");
        }
        setCode("");
    } else {
        alert("INVALID CODE SEQUENCE");
    }
  };

  if (!user) {
    return (
       <main className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
           <Navbar />
           <div className="text-center space-y-4">
               <Lock className="w-12 h-12 text-gray-500 mx-auto" />
               <h1 className="text-2xl font-heading uppercase">Restricted Access</h1>
               <Button onClick={() => openAuthModal('login')} className="bg-primary text-black hover:bg-white uppercase tracking-widest">
                   Login Required
               </Button>
           </div>
       </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      
      {/* Header Banner */}
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
              <div className="flex items-center gap-4 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
                  <Trophy size={14} />
                  <span>Achievement System // User_001</span>
              </div>
              <h1 className="font-heading text-6xl md:text-8xl font-bold text-white mb-4 uppercase tracking-tighter">
                  Trophy Room
              </h1>
              <p className="font-mono text-sm text-gray-500 tracking-widest uppercase max-w-xl">
                  Complete sets to unlock exclusive digital rewards and 3D artifacts.
              </p>
          </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: Collection Sets */}
        <div className="lg:col-span-8 space-y-12">
            {Array.isArray(collectionSets) && collectionSets.map((set) => {
                const isComplete = set.collected.length === set.total;
                const progress = (set.collected.length / set.total) * 100;

                return (
                    <div key={set.id} className="border border-[#333] bg-[#0a0a0a] p-6 md:p-8 relative overflow-hidden group">
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 h-1 bg-[#222] w-full">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-primary"
                            />
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="font-heading text-3xl text-white uppercase tracking-wide mb-2">{set.title}</h3>
                                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                                    <span>Status: {isComplete ? "Complete" : "In Progress"}</span>
                                    <span className="text-primary">[{set.collected.length}/{set.total}]</span>
                                </div>
                            </div>
                            {isComplete && (
                                <div className="bg-primary text-black px-4 py-2 font-heading uppercase tracking-widest text-sm animate-pulse">
                                    Set Complete
                                </div>
                            )}
                        </div>

                        {/* Items Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {set.items.map((item) => {
                                const isCollected = set.collected.includes(item.id);
                                return (
                                    <Link href={`/collectibles/${item.id}`} key={item.id} className="block">
                                        <div className={`aspect-square border ${isCollected ? "border-primary/50 bg-[#151515]" : "border-[#333] border-dashed bg-transparent"} relative flex flex-col items-center justify-center p-4 group/item transition-all hover:border-primary cursor-pointer h-full`}>
                                        {isCollected ? (
                                            <>
                                                <div className={`w-16 h-16 rounded-full ${item.image} blur-xl opacity-20 absolute`}></div>
                                                    <Box className="w-8 h-8 text-white mb-2 relative z-10 group-hover/item:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-mono text-gray-400 uppercase text-center relative z-10 group-hover/item:text-white transition-colors">{item.name}</span>
                                                <div className="absolute top-2 right-2 text-primary">
                                                    <Star size={10} fill="currentColor" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                    <Lock className="w-6 h-6 text-gray-700 mb-2 group-hover/item:text-gray-500 transition-colors" />
                                                    <span className="text-[10px] font-mono text-gray-700 uppercase text-center group-hover/item:text-gray-500 transition-colors">Locked</span>
                                            </>
                                        )}
                                    </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Right: Code Input & Reward */}
        <div className="lg:col-span-4 space-y-8">
            {/* Code Input */}
            <div className="bg-[#0a0a0a] border border-[#333] p-6 md:p-8 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-transparent"></div>
                <h3 className="font-heading text-xl text-white mb-6 uppercase flex items-center gap-2">
                    <Scan size={18} className="text-primary" /> Claim Item
                </h3>
                
                <form onSubmit={handleClaim} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-primary font-mono">Item Code</label>
                        <Input 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="bg-[#111] border-[#333] text-white font-mono text-lg tracking-[0.5em] uppercase h-14 text-center focus:border-primary focus:ring-0 rounded-none placeholder:text-gray-800"
                            placeholder="CODE"
                            maxLength={6}
                        />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-[#222] hover:bg-primary hover:text-black text-white font-heading uppercase tracking-widest rounded-none transition-all">
                        <Unlock size={16} className="mr-2" /> Authenticate
                    </Button>
                </form>
            </div>

            {/* Reward Preview */}
            <AnimatePresence>
                {unlockedReward && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-gradient-to-b from-[#111] to-[#000] border border-primary/50 p-8 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,79,0,0.15),transparent)] animate-pulse"></div>
                        
                        <Trophy size={48} className="mx-auto text-primary mb-4" />
                        <h3 className="font-heading text-2xl text-white uppercase tracking-wide mb-2">Achievement Unlocked</h3>
                        <p className="text-primary font-mono text-sm uppercase tracking-widest mb-6">{unlockedReward}</p>
                        
                        <div className="w-full aspect-square bg-[#0a0a0a] border border-[#333] relative flex items-center justify-center mb-4 group cursor-pointer">
                            {/* 3D Model Placeholder */}
                            <div className="w-32 h-32 border-[1px] border-primary/30 rounded-full animate-[spin_10s_linear_infinite] flex items-center justify-center">
                                <div className="w-24 h-24 border-[1px] border-white/20 rotate-45 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-primary/20 blur-md"></div>
                                </div>
                            </div>
                            <div className="absolute bottom-4 text-[10px] font-mono text-gray-500 uppercase">Interactive Model</div>
                        </div>

                        <Button className="w-full border border-primary text-primary hover:bg-primary hover:text-black bg-transparent font-heading uppercase tracking-widest text-xs h-10 rounded-none">
                            View in 3D
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

      </div>
    </main>
  );
}
