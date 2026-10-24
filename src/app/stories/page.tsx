import { Suspense } from "react";
import {
  sampleBalance,
  sampleStories,
  storiesShowSamples,
} from "@/lib/story-samples";
import { StoriesBrowser, StoriesSkeleton } from "./stories-browser";

export const dynamic = "force-dynamic";

export default function StoriesPage() {
  const samples = storiesShowSamples(process.env["VERCEL_ENV"]);

  return (
    <Suspense fallback={<StoriesSkeleton />}>
      <StoriesBrowser
        samples={samples}
        catalog={sampleStories(samples)}
        samplePoints={sampleBalance(samples)}
      />
    </Suspense>
  );
}
