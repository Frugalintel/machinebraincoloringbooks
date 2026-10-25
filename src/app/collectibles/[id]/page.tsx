import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCollectibleById } from "@/lib/game-data";
import { homeShowsSamples } from "@/lib/home";
import { CollectibleDetail } from "./collectible-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = findCollectibleById(id);
  if (!found) return { title: "Collectible · Machine Brain" };
  return {
    title: `${found.item.name} · Machine Brain`,
    description: found.item.lore,
  };
}

export default async function CollectiblePage({ params }: PageProps) {
  const { id } = await params;
  const found = findCollectibleById(id);

  if (!found) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <CollectibleDetail
        itemId={found.item.id}
        allowFixture={homeShowsSamples(process.env["VERCEL_ENV"])}
      />
    </Suspense>
  );
}
