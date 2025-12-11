"use client";

import { motion } from "framer-motion";

export function CollectiblesSection() {
  return (
    <section className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-8 w-4 bg-primary"></div>
        <h2 className="font-heading text-5xl md:text-6xl font-bold tracking-tighter text-white">
          COLLECTIBLES
        </h2>
      </div>

      <div className="flex-1 border border-[#222] bg-[#151515] p-6 md:p-10 flex flex-col gap-8 relative shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        
        {/* Print Artifacts: Registration Marks */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#222] opacity-50"></div>
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#222] opacity-50"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#222] opacity-50"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#222] opacity-50"></div>

        {/* Top Grid - Badges */}
        <div className="grid grid-cols-2 gap-6">
           {/* Circle Badge */}
           <motion.div 
             whileHover={{ scale: 1.05 }}
             className="bg-[#1a1a1a] p-6 flex items-center justify-center border border-[#222] aspect-square cursor-pointer group"
           >
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-[#4a4a4a] bg-[#1e3a8a] flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:border-primary transition-colors">
                 <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">★</span>
                 </div>
              </div>
           </motion.div>

           {/* Shield Badge */}
           <motion.div 
             whileHover={{ scale: 1.05 }}
             className="bg-[#1a1a1a] p-6 flex items-center justify-center border border-[#222] aspect-square cursor-pointer group"
           >
              <div className="w-24 h-28 bg-[#c2410c] flex items-center justify-center relative shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:bg-primary transition-colors" 
                   style={{ clipPath: "polygon(50% 0, 100% 25%, 100% 85%, 50% 100%, 0 85%, 0 25%)" }}>
                 {/* Stitching effect */}
                 <div className="absolute inset-1 border-2 border-dashed border-white/30" style={{ clipPath: "polygon(50% 0, 100% 25%, 100% 85%, 50% 100%, 0 85%, 0 25%)" }}></div>
                 <span className="text-white text-3xl font-bold font-heading mt-1">M</span>
              </div>
           </motion.div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
             <div className="h-[1px] flex-1 bg-[#333]"></div>
             <span className="font-heading text-xl text-primary tracking-widest uppercase">Limited Edition</span>
             <div className="h-[1px] flex-1 bg-[#333]"></div>
        </div>

        {/* Large Patch Box */}
        <motion.div 
            whileHover={{ y: -5 }}
            className="border border-primary/30 p-8 bg-[#1a1a1a] relative overflow-hidden group cursor-pointer"
        >
            <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay"></div>
            
            {/* Embroidered Texture Effect */}
            <div className="border-4 border-primary p-6 text-center relative bg-[#111] shadow-inner">
                <div className="absolute inset-1 border-2 border-dashed border-primary/50"></div>
                <h3 className="font-heading text-5xl text-primary tracking-widest drop-shadow-md">MACHINE<br/>BRAIN</h3>
            </div>
            
            <div className="absolute top-3 right-3 text-[9px] text-primary/70 font-sans border border-primary/30 px-2 py-0.5 uppercase tracking-widest">Est. 2025</div>
        </motion.div>

        {/* Tote Bag / Merch Mockup */}
        <div className="mt-auto pt-8">
             <div className="flex items-center justify-between mb-4">
                 <span className="font-heading text-xl text-white tracking-widest uppercase">Exclusive Merch</span>
                 <div className="flex gap-1">
                     <div className="w-2 h-2 rounded-full bg-primary"></div>
                     <div className="w-2 h-2 rounded-full bg-[#333]"></div>
                 </div>
             </div>

             <div className="bg-[#e5e5e5] p-8 flex items-center justify-center border border-[#222] aspect-[16/9] relative overflow-hidden group cursor-pointer">
                 {/* Canvas Texture */}
                 <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-20 mix-blend-multiply"></div>
                 
                 <motion.div 
                    whileHover={{ scale: 1.05, rotate: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative"
                 >
                    <div className="w-40 h-48 bg-[#f0f0f0] shadow-xl flex flex-col items-center justify-center p-2 border border-black/10 relative z-10">
                        <div className="w-full h-full border-2 border-black flex items-center justify-center bg-primary/5 group-hover:bg-primary/20 transition-colors">
                            <span className="font-heading text-black text-xl leading-none text-center font-bold">TOTE<br/>BRAIN</span>
                        </div>
                    </div>
                    {/* Handles */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 border-[6px] border-[#d4d4d4] rounded-full border-b-transparent -z-0"></div>
                 </motion.div>
             </div>
        </div>

      </div>
    </section>
  );
}
