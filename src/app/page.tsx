import { Book, Key, Sparkles } from "lucide-react";
import { Hero } from "@/components/hero";
import { StoreSection } from "@/components/store-section";
import { StoriesSection } from "@/components/stories-section";
import { CollectiblesSection } from "@/components/collectibles-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground relative">
      <Hero />

      {/* Store Section - Full Width Background */}
      <section className="bg-[#111] py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-10 lg:px-16">
          <StoreSection />
        </div>
      </section>

      {/* How It Works - Distinct Separator Section */}
      <section className="bg-[#0a0a0a] border-y border-[#222] py-20">
        <div className="container mx-auto px-4 md:px-10 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] mb-3">
              How It Works
            </p>
            <h3 className="font-heading text-2xl md:text-4xl text-white uppercase tracking-tight mb-12">
              Every book has a secret code.
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 border border-[#333] bg-[#111] flex items-center justify-center rounded-sm group-hover:border-primary/50 transition-colors">
                  <Book size={24} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-sm text-white uppercase tracking-wide">
                    1. Get the book
                  </h4>
                  <p className="text-gray-500 text-xs font-mono">
                    Choose your adventure above
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 border border-[#333] bg-[#111] flex items-center justify-center rounded-sm group-hover:border-primary/50 transition-colors">
                  <Key size={24} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-sm text-white uppercase tracking-wide">
                    2. Find the code
                  </h4>
                  <p className="text-gray-500 text-xs font-mono">
                    Hidden on the back page
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 border border-[#333] bg-[#111] flex items-center justify-center rounded-sm group-hover:border-primary/50 transition-colors">
                  <Sparkles size={24} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-sm text-white uppercase tracking-wide">
                    3. Unlock Rewards
                  </h4>
                  <p className="text-gray-500 text-xs font-mono">
                    Access stories & collectibles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Section - Full Width */}
      <section className="bg-[#111] py-16 md:py-24 border-b border-[#222]">
        <div className="container mx-auto px-4 md:px-10 lg:px-16">
          <StoriesSection />
        </div>
      </section>

      {/* Collectibles Section - Full Width */}
      <section className="bg-[#111] py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-10 lg:px-16">
          <CollectiblesSection />
        </div>
      </section>
    </main>
  );
}
