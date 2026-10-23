import { notFound } from "next/navigation";
import { findCollectibleById } from "@/lib/game-data";
import { CollectibleDetail } from "./collectible-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectiblePage({ params }: PageProps) {
  const { id } = await params;
  const found = findCollectibleById(id);

  if (!found) {
    notFound();
  }

  return <CollectibleDetail collectible={found.item} parentSet={found.set} />;
}
