"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { CollectibleItem } from "@/lib/game-data";
import { LockedFigure } from "./locked-figure";

type TrophyCanvasProps = {
  className?: string;
  size?: "small" | "large";
  rarity?: string;
  autoRotate?: boolean;
  isInteractive?: boolean;
  transparent?: boolean;
  particles?: boolean;
  unlockedAt?: string;
  lastPolishedAt?: string;
};

/**
 * Loads the three.js trophy only after mount.
 * `next/dynamic({ ssr: false })` left the CSR bailout template in place
 * and the canvas never replaced it on these routes.
 */
export function ObjectSlot({
  item,
  owned,
  size,
  className,
  unlockedAt,
  lastPolishedAt,
}: {
  item: CollectibleItem;
  owned: boolean;
  size: "small" | "large";
  className?: string;
  unlockedAt?: string;
  lastPolishedAt?: string;
}) {
  const [TrophyCanvas, setTrophyCanvas] =
    useState<ComponentType<TrophyCanvasProps> | null>(null);

  useEffect(() => {
    if (!owned) return;
    let cancelled = false;
    void import("@/components/three").then((module) => {
      if (!cancelled) setTrophyCanvas(() => module.TrophyCanvas);
    });
    return () => {
      cancelled = true;
    };
  }, [owned]);

  if (!owned) {
    return <LockedFigure item={item} className={className} />;
  }

  if (!TrophyCanvas) {
    return <div className={className} aria-hidden="true" />;
  }

  return (
    <TrophyCanvas
      className={className}
      size={size}
      rarity={item.rarity}
      autoRotate
      isInteractive={false}
      transparent
      particles={false}
      unlockedAt={unlockedAt}
      lastPolishedAt={lastPolishedAt}
    />
  );
}
