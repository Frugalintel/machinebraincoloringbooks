"use client";

import { Oswald } from "next/font/google";

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
});

export function ComingSoon() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,34,34,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(34,34,34,0.2)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />

      {/* CRT Scanline */}
      <div className="crt-scanline" />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center p-4 text-center space-y-8 max-w-4xl w-full">
        {/* Machine Brain Logo Text */}
        <h1 
          className={`${oswald.className} text-6xl md:text-9xl font-bold tracking-tighter text-foreground uppercase animate-pulse-slow`}
        >
          Machine <span className="text-brand-orange">Brain</span>
        </h1>

        {/* Coming Soon Text */}
        <div className="relative">
          <div className="absolute -inset-4 bg-brand-orange/10 blur-xl rounded-full" />
          <h2 className={`${oswald.className} relative text-2xl md:text-4xl font-light tracking-[0.5em] text-foreground/80 uppercase border-y border-brand-orange/30 py-4 px-8 text-flicker`}>
            Coming Soon
          </h2>
        </div>

        {/* Teaser Text */}
        <p className="font-mono text-brand-orange/80 text-sm md:text-lg tracking-widest uppercase mt-8 animate-pulse">
          &gt; System Initialization In Progress...
          <br/>
          &gt; Vintage Sci-Fi Coloring Books Loading...
        </p>

        {/* Decorative Elements */}
        <div className="absolute bottom-10 left-10 hidden md:block text-xs font-mono text-zinc-700">
          ID: MB-2024-X
          <br />
          SECURE CONNECTION
        </div>
        
        <div className="absolute top-10 right-10 hidden md:block text-xs font-mono text-zinc-700 text-right">
          SYS.STATUS: STANDBY
          <br />
          Protocol: V-SF-01
        </div>
      </div>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}

