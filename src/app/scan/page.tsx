import { Suspense } from "react";
import { homeShowsSamples } from "@/lib/home";
import { ScanPageClient } from "./scan-page-client";

export default function ScanPage() {
  const allowFixture = homeShowsSamples(process.env["VERCEL_ENV"]);
  return (
    <Suspense fallback={<main id="main" className="lg dark plate" />}>
      <ScanPageClient allowFixture={allowFixture} />
    </Suspense>
  );
}
