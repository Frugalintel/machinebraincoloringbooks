import { HomeHero } from "@/components/home-hero";
import { HomeLibrary } from "@/components/home-library";
import { HomeUnlocks } from "@/components/home-unlocks";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HomeHero />
      <HomeLibrary />
      <HomeUnlocks />
    </main>
  );
}
