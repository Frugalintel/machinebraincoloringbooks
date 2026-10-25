import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HomeFooter } from "@/components/home-footer";
import { ABOUT_HERO_COPY } from "@/lib/about";
import { homeShowsSamples } from "@/lib/home";
import "../home.css";
import "./about.css";

export const metadata: Metadata = {
  title: "About · Machine Brain",
  description: ABOUT_HERO_COPY.lede.replace(/\u00a0/g, " "),
};

/** About reuses Home's tokens and the "Take your time." plate. */
export default function AboutLayout({ children }: { children: ReactNode }) {
  const samples = homeShowsSamples(process.env.VERCEL_ENV);

  return (
    <div className="home-e2 about-a" data-samples={samples ? "on" : "off"}>
      {children}
      <HomeFooter samples={samples} />
    </div>
  );
}
