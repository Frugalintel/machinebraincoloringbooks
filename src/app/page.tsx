import "./home.css";
import { HomeFooter } from "@/components/home-footer";
import { HomeHero } from "@/components/home-hero";
import {
  HomeCodes,
  HomeEnter,
  HomeRest,
  HomeSplit,
} from "@/components/home-plates";
import { HomeShop } from "@/components/home-shop";
import { HomeWorlds } from "@/components/home-worlds";
import { homeShowsSamples } from "@/lib/home";

export default function Home() {
  const samples = homeShowsSamples(process.env.VERCEL_ENV);

  return (
    <div className="home-e2" data-samples={samples ? "on" : "off"}>
      <main>
        <HomeHero />
        <HomeShop samples={samples} />
        <HomeRest />
        <HomeCodes samples={samples} />
        <HomeSplit />
        <HomeEnter samples={samples} />
        <HomeWorlds samples={samples} />
      </main>
      <HomeFooter samples={samples} />
    </div>
  );
}
