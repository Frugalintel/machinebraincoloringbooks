import Image from "next/image";
import type { CollectibleItem } from "@/lib/game-data";
import { itemArt } from "@/lib/collectibles-view";
import { LinePlaceholder } from "./line-placeholder";

export function LockedFigure({
  item,
  className,
}: {
  item: Pick<CollectibleItem, "name" | "art">;
  className?: string;
}) {
  const art = itemArt(item);
  if (art.kind === "still") {
    return (
      <Image
        className={className}
        src={art.src}
        alt=""
        width={1024}
        height={1024}
        unoptimized={art.src.startsWith("http")}
      />
    );
  }
  return <LinePlaceholder className={className} />;
}
