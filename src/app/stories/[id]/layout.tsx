import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { fetchPublishedStory } from "@/lib/story-lookup";
import { sampleStory, storiesShowSamples } from "@/lib/story-samples";

/**
 * Missing stories 404 here, outside the page loading boundary, so the
 * response status is 404. Sample ids stay available when samples are on.
 */
export default async function StoryIdLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const samples = storiesShowSamples(process.env["VERCEL_ENV"]);
  const story = sampleStory(samples, id) ?? (await fetchPublishedStory(id));

  if (!story) {
    notFound();
  }

  return children;
}
