"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

type TrophyCanvasProps = {
  className?: string;
  size?: "small" | "large";
  rarity?: string;
  autoRotate?: boolean;
  isInteractive?: boolean;
  transparent?: boolean;
  particles?: boolean;
  modelUrl?: string;
  posterUrl?: string;
  frameloop?: "always" | "demand";
  powerPreference?: "default" | "high-performance" | "low-power";
  fitBounds?: boolean;
  onReady?: () => void;
};

/**
 * Placeholder example trophies. Loads three.js only when a GLB is near.
 */
export function ScanTrophy({
  url,
  posterUrl,
  rarity,
  stamp,
  caption,
  reducedMotion,
}: {
  url: string;
  posterUrl?: string | null;
  rarity: string;
  stamp?: string | null;
  caption: string;
  reducedMotion: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(
    () => typeof IntersectionObserver !== "function",
  );
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver !== "function",
  );
  const [TrophyCanvas, setTrophyCanvas] =
    useState<ComponentType<TrophyCanvasProps> | null>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver !== "function") return;
    const nearIo = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { root: null, rootMargin: "100% 0px" },
    );
    const viewIo = new IntersectionObserver(
      (entries) => {
        setVisible(entries.some((entry) => entry.isIntersecting));
      },
      { root: null, rootMargin: "0px" },
    );
    nearIo.observe(node);
    viewIo.observe(node);
    return () => {
      nearIo.disconnect();
      viewIo.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    void import("@/components/three").then((module) => {
      if (!cancelled) setTrophyCanvas(() => module.TrophyCanvas);
    });
    return () => {
      cancelled = true;
    };
  }, [near]);

  const poster = posterUrl ?? undefined;

  return (
    <div ref={rootRef} className="trophy" aria-label={caption}>
      {stamp ? <p className="stamp mono">{stamp}</p> : null}
      {TrophyCanvas ? (
        <TrophyCanvas
          size="large"
          rarity={rarity}
          autoRotate={!reducedMotion}
          isInteractive={false}
          transparent
          particles={false}
          modelUrl={url}
          posterUrl={poster}
          frameloop={reducedMotion || !visible ? "demand" : "always"}
          powerPreference="default"
          fitBounds
        />
      ) : poster ? (
        // Poster is a static still; next/image is not required for this wait state.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="trophy-poster" src={poster} alt="" />
      ) : (
        <div aria-hidden="true" />
      )}
    </div>
  );
}
