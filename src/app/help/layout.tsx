import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HomeFooter } from "@/components/home-footer";
import { HELP_LEDE } from "@/lib/help";
import { homeShowsSamples } from "@/lib/home";
import "../home.css";
import "./help.css";

export const metadata: Metadata = {
  title: "Help · Machine Brain",
  description: HELP_LEDE,
};

/** Help reuses Home's tokens and the "Take your time." plate. */
export default function HelpLayout({ children }: { children: ReactNode }) {
  const samples = homeShowsSamples(process.env.VERCEL_ENV);

  return (
    <div className="home-e2 help-a" data-samples={samples ? "on" : "off"}>
      {children}
      <HomeFooter samples={samples} />
    </div>
  );
}
