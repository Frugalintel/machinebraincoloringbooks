"use client";

import { useEffect, useState, type ComponentType } from "react";

type TrophyCanvasProps = {
  className?: string;
  size?: "small" | "large";
  rarity?: string;
  autoRotate?: boolean;
  isInteractive?: boolean;
  transparent?: boolean;
  particles?: boolean;
  modelUrl?: string;
};

/**
 * Placeholder example trophies. Loads three.js only when a GLB is shown.
 */
export function ScanTrophy({
  url,
  rarity,
  caption,
  note,
  reducedMotion,
}: {
  url: string;
  rarity: string;
  caption: string;
  note?: string;
  reducedMotion: boolean;
}) {
  const [TrophyCanvas, setTrophyCanvas] =
    useState<ComponentType<TrophyCanvasProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/components/three").then((module) => {
      if (!cancelled) setTrophyCanvas(() => module.TrophyCanvas);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="trophy" aria-label={caption}>
      {TrophyCanvas ? (
        <TrophyCanvas
          size="large"
          rarity={rarity}
          autoRotate={!reducedMotion}
          isInteractive={false}
          transparent
          particles={false}
          modelUrl={url}
        />
      ) : (
        <div aria-hidden="true" />
      )}
      <p className="legcap mono">
        <span>{caption}</span>
        {note ? <span>{note}</span> : null}
      </p>
    </div>
  );
}
