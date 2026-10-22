import { Scale } from "lucide-react";

export default function LicensesPage() {
  return (
    <main className="min-h-screen bg-background text-cream font-sans">
      <div className="bg-background border-b border-line py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex items-center gap-2 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
            <Scale size={14} />
            <span>Legal</span>
          </div>
          <h1 className="font-display text-title uppercase text-cream mb-4">
            Licenses
          </h1>
          <p className="font-mono text-sm text-fg-muted tracking-widest uppercase max-w-xl">
            Third-party software and asset licenses.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-2xl text-fg-muted leading-relaxed space-y-6">
          <p>Content coming soon.</p>
        </div>
      </div>
    </main>
  );
}
