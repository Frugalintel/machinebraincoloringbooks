import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <div className="bg-[#111] border-b border-[#333] py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex items-center gap-2 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
            <Info size={14} />
            <span>Company</span>
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-white mb-4 uppercase tracking-tighter">
            About Us
          </h1>
          <p className="font-mono text-sm text-gray-500 tracking-widest uppercase max-w-xl">
            Building the future of interactive storytelling.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-2xl text-gray-400 leading-relaxed space-y-6">
          <p>Content coming soon.</p>
        </div>
      </div>
    </main>
  );
}
