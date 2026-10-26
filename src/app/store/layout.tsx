import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HomeFooter } from "@/components/home-footer";
import { storeShowsSamples } from "@/lib/store";
import "../home.css";
import "./store.css";

export const metadata: Metadata = {
  title: "Books · Machine Brain",
  description: "Coloring books, one world each.",
};

/** The store shares Home's plates, nav and footer; the root footer stays hidden. */
export default function StoreLayout({ children }: { children: ReactNode }) {
  const samples = storeShowsSamples(process.env.VERCEL_ENV);

  return (
    <div className="home-e2 store-e2" data-samples={samples ? "on" : "off"}>
      {children}
      <HomeFooter samples={samples} />
    </div>
  );
}
