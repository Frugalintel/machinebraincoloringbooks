import type { ReactNode } from "react";
import { HomeFooter } from "@/components/home-footer";
import { homeShowsSamples } from "@/lib/home";
import "@/app/home.css";

/** Near-black page with the "Take your time." plate. The root footer stays hidden. */
export function PlateFrame({ children }: { children: ReactNode }) {
  const samples = homeShowsSamples(process.env.VERCEL_ENV);

  return (
    <div className="home-e2 shell-doc" data-samples={samples ? "on" : "off"}>
      {children}
      <HomeFooter samples={samples} />
    </div>
  );
}
