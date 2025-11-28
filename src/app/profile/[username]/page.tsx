"use client";

import { Navbar } from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Box, Terminal, Trophy, Star, Shield, Zap, Lock, Scan, ChevronDown, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";
import Link from "next/link";
import { useState } from "react";

// Icons map for achievements
const iconMap: Record<string, React.ReactNode> = {
    "brush": <Star className="w-5 h-5" />,
    "trophy": <Trophy className="w-5 h-5" />,
    "zap": <Zap className="w-5 h-5" />,
    "star": <Star className="w-5 h-5" />,
    "code": <Terminal className="w-5 h-5" />
};

function AchievementTile({ ach }: { ach: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div 
            layout
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-4 border ${ach.unlocked ? "border-primary/30 bg-[#111]" : "border-[#333] bg-[#0a0a0a] opacity-60"} relative group transition-all hover:bg-[#151515] cursor-pointer overflow-hidden`}
        >
            <motion.div layout="position" className="flex items-start gap-4">
                <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border ${ach.unlocked ? "border-primary text-primary bg-primary/10" : "border-[#333] text-gray-600 bg-[#050505]"}`}>
                    {ach.unlocked ? iconMap[ach.icon] : <Lock size={16} />}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <motion.h4 layout="position" className={`font-heading text-lg uppercase ${ach.unlocked ? "text-white" : "text-gray-500"}`}>{ach.title}</motion.h4>
                        {ach.unlocked && <span className="text-[10px] font-mono text-primary border border-primary/30 px-1">UNLOCKED</span>}
                    </div>
                    <motion.p layout="position" className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-wide">{ach.description}</motion.p>
                    
                    {!ach.unlocked && ach.progress && (
                        <motion.div layout="position" className="mt-3">
                            <div className="flex justify-between text-[8px] font-mono text-gray-500 uppercase mb-1">
                                <span>Progress</span>
                                <span>{ach.progress}</span>
                            </div>
                            <div className="h-1 bg-[#222] w-full">
                                <div className="h-full bg-gray-600 w-1/3"></div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                         <div className="mt-4 pt-4 border-t border-[#333] grid grid-cols-2 gap-4">
                            {ach.details?.map((detail: any, i: number) => (
                                <div key={i}>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{detail.label}</p>
                                    <p className="text-sm font-mono text-white">{detail.value}</p>
                                </div>
                            )) || <p className="text-xs text-gray-500 font-mono col-span-2">No details available.</p>}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

             {/* Expand indicator */}
             <motion.div layout className={`absolute bottom-2 right-2 text-primary/50 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                 <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
             </motion.div>
        </motion.div>
    );
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user, signOut, openAuthModal } = useAuth();
  const { collectionSets, achievements, activeAchievementIds } = useGame();
  
  const isCurrentUser = username === "me" || (user && username === user.id);
  const displayName = isCurrentUser && user ? `USER_${user.initials}` : (username === "me" ? "GUEST" : username);
  const displayEmail = isCurrentUser && user ? user.email : "access@restricted";

  // Filter achievements to only show active ones (up to 5)
  const displayedAchievements = achievements.filter(ach => activeAchievementIds.includes(ach.id));

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      
      {/* Header Banner */}
      <div className="h-64 md:h-80 bg-[#111] relative overflow-hidden border-b border-[#333]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#222,black)] opacity-50"></div>
          <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
          
          {/* Grid Lines */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row items-end gap-8 mb-12">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group"
            >
                <Avatar className="w-40 h-40 border-4 border-[#111] rounded-none shadow-xl relative z-10 bg-[#222]">
                    <AvatarImage src="" /> {/* No image for now, force fallback */}
                    <AvatarFallback className="bg-[#222] text-4xl font-heading text-gray-400 rounded-none uppercase">
                        {isCurrentUser && user ? user.initials : "MB"}
                    </AvatarFallback>
                </Avatar>
                {/* Decorative Frame */}
                <div className="absolute -inset-2 border border-[#333] pointer-events-none z-0"></div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r border-b border-primary/50 pointer-events-none"></div>

                {isCurrentUser && (
                    <div className="absolute bottom-2 right-2 bg-primary text-black p-2 hover:bg-white transition-colors cursor-pointer z-20 border border-black">
                        <Settings className="w-4 h-4" />
                    </div>
                )}
            </motion.div>
            
            <div className="flex-1 mb-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                    <h1 className="font-heading text-4xl md:text-6xl font-bold uppercase leading-none tracking-tighter">
                        {displayName}
                    </h1>
                    <span className="self-start md:self-auto text-[10px] font-mono bg-primary/10 text-primary border border-primary/30 px-2 py-1 uppercase tracking-widest">
                        Auth Level: {isCurrentUser && user ? "1 (Verified)" : "0 (Guest)"}
                    </span>
                </div>
                <p className="text-gray-500 font-sans max-w-xl text-sm md:text-base uppercase tracking-wide flex items-center gap-2">
                    <Terminal size={12} /> Unit {user ? user.id.slice(-4) : "0000"} // Sector 9 // Status: Active
                </p>
            </div>

            <div className="flex gap-8 mb-6 text-center border-l border-[#333] pl-8 hidden md:flex">
                <div>
                    <p className="font-heading text-3xl font-bold text-white">
                        {achievements.filter(a => a.unlocked).length}
                    </p>
                    <p className="text-[10px] text-gray-500 tracking-widest uppercase font-mono">Badges</p>
                </div>
                <div>
                    <p className="font-heading text-3xl font-bold text-white">
                        {collectionSets.reduce((acc, set) => acc + set.collected.length, 0)}
                    </p>
                    <p className="text-[10px] text-gray-500 tracking-widest uppercase font-mono">Artifacts</p>
                </div>
            </div>
        </div>

        {/* --- FUN FIRST: ACHIEVEMENTS & COLLECTIBLES --- */}
        {user ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
                
                {/* Achievements Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-[#333] pb-4">
                        <h2 className="font-heading text-2xl text-white uppercase tracking-wide flex items-center gap-3">
                            <Trophy className="text-primary" /> Active Missions
                        </h2>
                        <Link href="/achievements">
                             <Button variant="ghost" className="h-8 text-[10px] font-mono uppercase tracking-widest hover:text-primary hover:bg-transparent">
                                Manage Loadout ({activeAchievementIds.length}/5) <Settings size={12} className="ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid gap-4">
                        {displayedAchievements.length > 0 ? (
                            displayedAchievements.map((ach) => (
                                <AchievementTile key={ach.id} ach={ach} />
                            ))
                        ) : (
                            <div className="p-8 border border-dashed border-[#333] text-center">
                                <p className="text-gray-500 font-mono text-xs uppercase mb-4">No active missions selected</p>
                                <Link href="/achievements">
                                    <Button variant="outline" className="text-[10px] font-mono uppercase tracking-widest">
                                        <Plus size={12} className="mr-2" /> Select Missions
                                    </Button>
                                </Link>
                            </div>
                        )}
                        
                        {/* Prompt to add more if slots available */}
                        {displayedAchievements.length < 5 && (
                             <Link href="/achievements" className="block p-4 border border-dashed border-[#333] text-center hover:border-gray-500 hover:bg-[#111] transition-all group cursor-pointer opacity-50 hover:opacity-100">
                                <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-white font-mono text-xs uppercase tracking-widest">
                                    <Plus size={14} /> Add Mission Slot
                                </div>
                             </Link>
                        )}
                    </div>
                </div>

                {/* Collectibles Showcase */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-[#333] pb-4">
                        <h2 className="font-heading text-2xl text-white uppercase tracking-wide flex items-center gap-3">
                            <Box className="text-primary" /> Digital Collection
                        </h2>
                        <Link href="/trophy-room">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-mono uppercase tracking-widest rounded-none border-[#333] hover:border-primary hover:text-primary">
                            Enter Codes <Scan className="ml-2 w-3 h-3" />
                        </Button>
                    </Link>
                    </div>

                    <div className="grid gap-6">
                        {collectionSets.map((set) => {
                            const progress = (set.collected.length / set.total) * 100;
                            return (
                                <div key={set.id} className="border border-[#333] bg-[#0a0a0a] p-4 relative group hover:border-[#444] transition-colors">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-heading text-lg text-white uppercase">{set.title}</h3>
                                        <span className="font-mono text-xs text-primary">{set.collected.length}/{set.total}</span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-1 bg-[#222] w-full mb-4">
                                        <div style={{ width: `${progress}%` }} className="h-full bg-primary/80"></div>
                                    </div>
                                    
                                    {/* Mini Grid of Items */}
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {set.items.map((item) => {
                                            const isCollected = set.collected.includes(item.id);
                                            return (
                                                <div key={item.id} className={`w-12 h-12 flex-shrink-0 border ${isCollected ? "border-primary/30 bg-[#151515]" : "border-[#222] bg-black"} flex items-center justify-center relative`}>
                                                    {isCollected ? (
                                                        <div className={`w-8 h-8 rounded-full ${item.image} opacity-50 blur-sm`}></div>
                                                    ) : (
                                                        <Lock size={10} className="text-[#333]" />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        ) : (
            <div className="mb-24 p-12 border border-[#333] bg-[#0a0a0a] relative overflow-hidden text-center group">
                 {/* Locked State Visuals */}
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                 <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                     <Lock className="w-64 h-64 text-gray-500" />
                 </div>
                 
                 <div className="relative z-10 max-w-lg mx-auto">
                    <Lock className="w-12 h-12 text-primary mx-auto mb-6" />
                    <h2 className="font-heading text-3xl text-white uppercase mb-4 tracking-wide">Access Restricted</h2>
                    <p className="text-gray-500 font-mono text-sm uppercase tracking-widest mb-8 leading-relaxed">
                        Classified data. Identify yourself to access achievement records and collection status.
                    </p>
                    <Button 
                        onClick={() => openAuthModal('login')} 
                        className="bg-primary text-black hover:bg-white font-heading uppercase tracking-widest px-8 py-6 rounded-none text-lg"
                    >
                        Authenticate User
                    </Button>
                 </div>
            </div>
        )}

        {/* --- MAINTENANCE SECTION: ORDERS & SETTINGS --- */}
        <div className="border-t border-[#333] pt-12">
            <h2 className="font-heading text-xl text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Shield size={16} /> Account Maintenance
            </h2>
             
            {user ? (
                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="w-full bg-transparent border-b border-[#333] p-0 h-auto justify-start rounded-none gap-8 mb-8 flex-wrap md:flex-nowrap">
                        <TabsTrigger 
                            value="history" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-600 font-heading text-sm px-0 pb-2 tracking-widest uppercase hover:text-gray-400 transition-colors flex-1 md:flex-none text-left justify-start"
                        >
                            Order History
                        </TabsTrigger>
                        <TabsTrigger 
                            value="settings" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-600 font-heading text-sm px-0 pb-2 tracking-widest uppercase hover:text-gray-400 transition-colors flex-1 md:flex-none text-left justify-start"
                        >
                            System Settings
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="history" className="mt-0">
                        <div className="border border-[#333] bg-[#0a0a0a]">
                            {/* Table Header */}
                            <div className="grid grid-cols-4 p-4 border-b border-[#333] text-[10px] text-gray-500 uppercase tracking-widest font-mono bg-[#111]">
                                <div>Order ID</div>
                                <div>Date</div>
                                <div>Status</div>
                                <div className="text-right">Total</div>
                            </div>

                            {/* Order Rows */}
                            {[1,2,3].map((i) => (
                                <div key={i} className="grid grid-cols-4 p-4 border-b border-[#333] text-sm font-sans items-center hover:bg-[#151515] transition-colors cursor-pointer group">
                                    <div className="font-mono text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                        <Box size={12} className="hidden md:block text-gray-600 group-hover:text-primary" />
                                        #ORD-2025-00{i}
                                    </div>
                                    <div className="text-gray-400 font-mono text-xs">NOV 2{i}, 2025</div>
                                    <div>
                                        <span className="bg-[#111] text-gray-400 text-[10px] px-2 py-1 border border-[#333] uppercase tracking-widest font-mono group-hover:border-primary/30 group-hover:text-primary transition-colors">
                                            [SHIPPED]
                                        </span>
                                    </div>
                                    <div className="text-right font-bold text-white font-mono">$45.00</div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="settings">
                        <div className="max-w-xl border border-[#333] bg-[#0a0a0a] p-8 relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-transparent"></div>
                            <h3 className="font-heading text-2xl text-white mb-8 uppercase flex items-center gap-3">
                                <Terminal size={20} className="text-gray-500" /> Account Data
                            </h3>
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Username / ID</label>
                                    <div className="p-4 bg-[#111] border border-[#333] text-gray-300 font-mono text-sm flex justify-between items-center">
                                        {displayName}
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Email Address</label>
                                    <div className="p-4 bg-[#111] border border-[#333] text-gray-300 font-mono text-sm">
                                        {displayEmail}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-[#333]">
                                    <Button className="bg-white text-black hover:bg-primary hover:text-black font-heading tracking-[0.2em] uppercase text-lg px-8 py-6 rounded-none w-full border border-transparent hover:border-black transition-all">
                                        Save Changes
                                    </Button>
                                    
                                    <div className="mt-4">
                                        <Button 
                                            variant="outline" 
                                            onClick={signOut}
                                            className="w-full border border-red-900/50 text-red-500 hover:bg-red-900 hover:text-white font-heading tracking-widest uppercase h-12 rounded-none"
                                        >
                                            Disconnect System (Logout)
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="p-8 border border-[#333] bg-[#0a0a0a] text-center text-gray-500 font-mono text-sm uppercase tracking-widest">
                    Log in to access account maintenance
                </div>
            )}
        </div>
      </div>
    </main>
  );
}
