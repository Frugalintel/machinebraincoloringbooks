import { Suspense } from "react";
import { homeShowsSamples } from "@/lib/home";
import { CollectiblesBrowser } from "./collectibles-browser";

export default function CollectiblesPage() {
  const allowFixture = homeShowsSamples(process.env["VERCEL_ENV"]);

  return (
    <Suspense fallback={null}>
      <CollectiblesBrowser allowFixture={allowFixture} />
    </Suspense>
  );
}
