import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HomeFooter } from "@/components/home-footer";
import { homeShowsSamples } from "@/lib/home";
import "../home.css";
import "./paths.css";

export const metadata: Metadata = {
  title: "Stories · Machine Brain",
  description:
    "Choose-your-path stories, set in the worlds of the books. Every fork is yours to take.",
};

/** Stories shares Home's nav and the "Take your time." plate. */
export default function StoriesLayout({ children }: { children: ReactNode }) {
  const samples = homeShowsSamples(process.env["VERCEL_ENV"]);

  return (
    <div className="home-e2 stories-b" data-samples={samples ? "on" : "off"}>
      {children}
      <HomeFooter samples={samples} />
    </div>
  );
}
