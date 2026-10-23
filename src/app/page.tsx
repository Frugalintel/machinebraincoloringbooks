import { Hero } from "@/components/hero";
import { HomeClose } from "@/components/home-close";
import { HomeFeatured } from "@/components/home-featured";
import { HomeHowItWorks } from "@/components/home-how-it-works";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <HomeHowItWorks />
      <HomeFeatured />
      <HomeClose />
    </main>
  );
}
