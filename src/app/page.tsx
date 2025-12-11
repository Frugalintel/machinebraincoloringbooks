import { Hero } from "@/components/hero";
import { StoreSection } from "@/components/store-section";
import { StoriesSection } from "@/components/stories-section";
import { CollectiblesSection } from "@/components/collectibles-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground relative">
      <Hero />
      <div className="p-4 md:p-10 space-y-12 bg-[#111]">
        <StoreSection />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          <StoriesSection />
          <CollectiblesSection />
        </div>
      </div>
    </main>
  );
}
