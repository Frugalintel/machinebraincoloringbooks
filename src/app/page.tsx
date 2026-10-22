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
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-10 lg:px-16">
          <StoreSection />
        </div>
      </section>

      {/* How It Works - Distinct Separator Section */}
      <section className="bg-background border-y border-line py-20">
        <div className="container mx-auto px-4 md:px-10 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-label mb-3 tracking-[0.12em] text-primary">
              How it works
            </p>
            <h2 className="font-heading text-h2 mb-12 text-cream">
              Every book has a secret code.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 border border-line bg-background flex items-center justify-center rounded-sm group-hover:border-primary/50 transition-colors">
                  <Book size={24} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-h3 text-cream">
                    1. Get the book
                  </h3>
                  <p className="text-fg-muted text-base">
                    Choose your adventure above
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 border border-line bg-background flex items-center justify-center rounded-sm group-hover:border-primary/50 transition-colors">
                  <Key size={24} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-h3 text-cream">
                    2. Find the code
                  </h3>
                  <p className="text-fg-muted text-base">
                    Hidden on the back page
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 border border-line bg-background flex items-center justify-center rounded-sm group-hover:border-primary/50 transition-colors">
                  <Sparkles size={24} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-h3 text-cream">
                    3. Unlock rewards
                  </h3>
                  <p className="text-fg-muted text-base">
                    Access stories & collectibles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Section - Full Width */}
      <section className="bg-background py-16 md:py-24 border-b border-line">
        <div className="container mx-auto px-4 md:px-10 lg:px-16">
          <StoriesSection />
        </div>
      </section>

      {/* Collectibles Section - Full Width */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-10 lg:px-16">
          <CollectiblesSection />
        </div>
      </section>
    </main>
  );
}
