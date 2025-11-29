"use client";

import { Oswald } from "next/font/google";
import { useEffect, useState } from "react";

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
});

export function ComingSoon() {
  const [text, setText] = useState("");
  const fullText = "> SYSTEM INITIALIZATION...\n> LOADING VINTAGE ASSETS...\n> ESTABLISHING SECURE CONNECTION...";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] overflow-hidden text-foreground selection:bg-brand-orange selection:text-black">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 grid-bg-move opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none" />

      {/* CRT Effects */}
      <div className="absolute inset-0 pointer-events-none z-50 crt-overlay mix-blend-overlay opacity-50" />
      <div className="crt-scanline" />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center p-4 text-center space-y-8 max-w-5xl w-full">
        
        {/* Top HUD */}
        <div className="absolute top-0 left-0 w-full flex justify-between p-6 md:p-12 text-xs font-mono text-zinc-600 uppercase tracking-widest">
           <div className="flex flex-col items-start gap-1">
             <span>SYS.ID: MB-ALPHA-1</span>
             <span className="text-brand-orange/50 animate-pulse">● ONLINE</span>
           </div>
           <div className="text-right hidden md:block">
             <span>SECURE PROTOCOL: ENCRYPTED</span>
             <br/>
             <span>LOC: UNKNOWN SECTOR</span>
           </div>
        </div>

        {/* Glitch Logo */}
        <div className="relative group">
          <div className="absolute -inset-8 bg-brand-orange/5 blur-3xl rounded-full group-hover:bg-brand-orange/10 transition-all duration-1000" />
          <h1 
            className={`${oswald.className} text-7xl md:text-[10rem] font-bold tracking-tighter uppercase leading-none glitch-text select-none`}
            data-text="MACHINE BRAIN"
          >
            Machine <span className="text-brand-orange">Brain</span>
          </h1>
        </div>

        {/* Subtitle Box */}
        <div className="relative border-y border-brand-orange/20 py-6 px-12 bg-black/20 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-orange" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-brand-orange" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-brand-orange" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-brand-orange" />
          
          <h2 className={`${oswald.className} text-xl md:text-3xl font-light tracking-[0.8em] text-foreground/90 uppercase text-flicker`}>
            Coming Soon
          </h2>
        </div>

        {/* Typing Terminal */}
        <div className="mt-12 font-mono text-brand-orange/70 text-xs md:text-sm tracking-widest uppercase min-h-[80px] text-left w-full max-w-lg bg-black/40 p-4 border border-zinc-900 rounded-sm shadow-inner">
          <pre className="whitespace-pre-wrap font-mono">{text}<span className="animate-pulse">_</span></pre>
        </div>

      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-6 w-full text-center">
         <p className="text-[10px] font-mono text-zinc-700 tracking-[0.3em] uppercase opacity-50 hover:opacity-100 transition-opacity">
           © 2024 Machine Brain Industries
         </p>
      </div>

      {/* Heavy Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_120%)] z-10" />
    </div>
  );
}
