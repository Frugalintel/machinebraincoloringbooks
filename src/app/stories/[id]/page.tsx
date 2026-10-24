import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublishedStory, listPublishedStoryIds } from "@/lib/story-lookup";
import {
  sampleBalance,
  sampleStories,
  sampleStory,
  storiesShowSamples,
} from "@/lib/story-samples";
import { StoriesSkeleton } from "../stories-browser";
import { StoryClient } from "./story-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const samples = storiesShowSamples(process.env["VERCEL_ENV"]);
  const ids = new Set(sampleStories(samples).map((story) => story.id));
  for (const id of await listPublishedStoryIds()) ids.add(id);
  return [...ids].map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const samples = storiesShowSamples(process.env["VERCEL_ENV"]);
  const preview = sampleStory(samples, id);
  if (preview) return { title: `${preview.title} · Machine Brain` };
  const published = await fetchPublishedStory(id);
  if (!published) return { title: "Story not found · Machine Brain" };
  return { title: `${published.title} · Machine Brain` };
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params;
  const samples = storiesShowSamples(process.env["VERCEL_ENV"]);
  const story = sampleStory(samples, id) ?? (await fetchPublishedStory(id));

  if (!story) {
    notFound();
  }

  return (
    <Suspense fallback={<StoriesSkeleton />}>
      <StoryClient
        id={id}
        samples={samples}
        preview={sampleStory(samples, id) ?? null}
        catalog={sampleStories(samples)}
        samplePoints={sampleBalance(samples)}
      />
    </Suspense>
  );
}
