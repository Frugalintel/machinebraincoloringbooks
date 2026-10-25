import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HomeFooter } from "@/components/home-footer";
import { homeShowsSamples } from "@/lib/home";
import "../home.css";
import "./scan-ledger.css";

export const metadata: Metadata = {
  title: "Scan · Machine Brain",
  description: "Register a book and enter the code by the page number.",
};

export default function ScanLayout({ children }: { children: ReactNode }) {
  const samples = homeShowsSamples(process.env["VERCEL_ENV"]);

  return (
    <div className="home-e2 scan-c" data-samples={samples ? "on" : "off"}>
      {children}
      <HomeFooter samples={samples} />
    </div>
  );
}
