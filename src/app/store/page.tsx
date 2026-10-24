import type { Metadata } from "next";
import { Suspense } from "react";
import { storeShowsSamples } from "@/lib/store";
import { StoreListing, StoreListingSkeleton } from "./store-listing";

export const metadata: Metadata = {
  title: "All books | Machine Brain",
  description:
    "Coloring books from Machine Brain. Each book is one world, drawn in fine, patient line.",
};

export default function StorePage() {
  const samples = storeShowsSamples(process.env.VERCEL_ENV);

  return (
    <Suspense fallback={<StoreListingSkeleton samples={samples} />}>
      <StoreListing samples={samples} />
    </Suspense>
  );
}
