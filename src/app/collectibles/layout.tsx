import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HomeFooter } from "@/components/home-footer";
import { homeShowsSamples } from "@/lib/home";
import "../home.css";
import "./vitrine.css";

export const metadata: Metadata = {
  title: "Collectibles · Machine Brain",
  description:
    "Digital rewards you can unlock by entering codes from your coloring books.",
};

/** Collectibles shares Home's nav and the "Take your time." plate. */
export default function CollectiblesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const samples = homeShowsSamples(process.env["VERCEL_ENV"]);

  return (
    <div className="home-e2 vitrine" data-samples={samples ? "on" : "off"}>
      {children}
      <HomeFooter samples={samples} />
    </div>
  );
}
