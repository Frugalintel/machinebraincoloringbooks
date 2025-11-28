import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { StoreSection } from "@/components/store-section";
import { StoriesSection } from "@/components/stories-section";
import { CollectiblesSection } from "@/components/collectibles-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground border-x border-[#333] max-w-[1600px] mx-auto my-0 md:my-8 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative">
      <Navbar />
      <Hero />
      <div className="p-4 md:p-10 space-y-12 bg-[#111]">
        <StoreSection />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          <StoriesSection />
          <CollectiblesSection />
        </div>
      </div>
      <Footer />
    </main>
  );
}
