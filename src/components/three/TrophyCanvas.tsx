"use client";

import { Suspense, useMemo, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  getTrophyEntropy,
  getCurrentSeason,
  getSeasonalModifier,
} from "@/lib/trophy-utils";
import { TrophyModel } from "./TrophyModel";
import { SeasonalParticles } from "./SeasonalParticles";

interface TrophyCanvasProps {
  size?: "small" | "large";
  rarity?: string;
  isInteractive?: boolean;
  autoRotate?: boolean;
  className?: string;
  // Entropy-related props
  unlockedAt?: string;
  lastPolishedAt?: string;
  // Optional: override computed values for testing
  entropyOverride?: number;
  seasonOverride?: "Spring" | "Summer" | "Fall" | "Winter";
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#333" />
    </mesh>
  );
}

export function TrophyCanvas({
  size = "small",
  rarity = "Common",
  isInteractive = false,
  autoRotate = true,
  className = "",
  unlockedAt,
  lastPolishedAt,
  entropyOverride,
  seasonOverride,
}: TrophyCanvasProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isSmall = size === "small";
  const isLarge = size === "large";

  // Compute entropy based on timestamps
  const entropy = useMemo(() => {
    if (entropyOverride !== undefined) return entropyOverride;
    return getTrophyEntropy(unlockedAt, lastPolishedAt);
  }, [unlockedAt, lastPolishedAt, entropyOverride]);

  // Get current season
  const season = useMemo(() => {
    if (seasonOverride) return seasonOverride;
    return getCurrentSeason();
  }, [seasonOverride]);

  // Get seasonal modifier for particles
  const seasonMod = useMemo(() => getSeasonalModifier(season), [season]);

  // Camera position based on size
  const cameraPosition: [number, number, number] = isSmall
    ? [0, 0.5, 3]
    : [0, 0.8, 4];

  if (!mounted) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          ...(isSmall ? {} : { minHeight: "400px" }),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid rgba(255,79,0,0.3)",
            borderRadius: "50%",
            borderTopColor: "#ff4f00",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        ...(isSmall ? {} : { minHeight: "400px" }),
        touchAction: isInteractive ? "none" : "auto",
        position: "relative",
      }}
    >
      <Canvas
        camera={{
          position: cameraPosition,
          fov: isSmall ? 40 : 50,
        }}
        frameloop="always"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* Lighting - adjust based on season */}
        <ambientLight intensity={0.5 * seasonMod.intensity} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1 * seasonMod.intensity}
        />
        <directionalLight
          position={[-5, -5, -5]}
          intensity={0.3}
          color="#60a5fa"
        />
        <pointLight
          position={[0, 3, 0]}
          intensity={0.8 * seasonMod.intensity}
          color="#ffffff"
        />

        {/* Trophy Model with entropy and season */}
        <Suspense fallback={<LoadingFallback />}>
          <TrophyModel
            rarity={rarity}
            autoRotate={autoRotate}
            entropy={entropy}
            season={season}
          />
        </Suspense>

        {/* Seasonal Particles - only for large views (performance) */}
        {isLarge ? (
          <SeasonalParticles
            season={season}
            particleColor={seasonMod.particleColor}
            count={80}
          />
        ) : null}

        {/* Controls - only for interactive/large views */}
        {isInteractive ? (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.5}
            autoRotate={autoRotate}
            autoRotateSpeed={1}
          />
        ) : null}
      </Canvas>
    </div>
  );
}
