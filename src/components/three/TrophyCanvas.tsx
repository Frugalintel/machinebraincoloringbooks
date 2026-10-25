"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import {
  getTrophyEntropy,
  getCurrentSeason,
  getSeasonalModifier,
} from "@/lib/trophy-utils";
import {
  FITTED_LOOK_AT,
  fittedCameraPosition,
} from "@/lib/scan-ledger/trophy-frame";
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
  /** Vitrine stages paint the lamp behind the mesh. */
  transparent?: boolean;
  /** Large views draw seasonal particles unless this is false. */
  particles?: boolean;
  /** Per-item GLB. Absent items keep the procedural placeholder. */
  modelUrl?: string;
  /** Still shown until the GLB is ready, and used if the GLB fails. */
  posterUrl?: string;
  frameloop?: "always" | "demand";
  powerPreference?: "default" | "high-performance" | "low-power";
  /** Fit the loaded mesh to the camera box with padding. */
  fitBounds?: boolean;
  onReady?: () => void;
}

type GlbTrophyComponent = ComponentType<{
  url: string;
  rarity?: string;
  autoRotate?: boolean;
  size?: "small" | "large";
  compact?: boolean;
  onReady?: () => void;
  onError?: () => void;
  fitBounds?: boolean;
}>;

const COMPACT_VIEWPORT = "(max-width: 760px)";

function subscribeCompactViewport(onStoreChange: () => void) {
  const media = window.matchMedia(COMPACT_VIEWPORT);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function useCompactViewport() {
  return useSyncExternalStore(
    subscribeCompactViewport,
    () => window.matchMedia(COMPACT_VIEWPORT).matches,
    () => true,
  );
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
  transparent = false,
  particles = true,
  modelUrl,
  posterUrl,
  frameloop = "always",
  powerPreference = "high-performance",
  fitBounds = false,
  onReady,
}: TrophyCanvasProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const compact = useCompactViewport();
  const isSmall = size === "small";
  const isLarge = size === "large";
  const pixelRatio: [number, number] = isSmall || compact ? [1, 1.5] : [1, 2];
  const [GlbTrophy, setGlbTrophy] = useState<GlbTrophyComponent | null>(null);
  const [glbStatus, setGlbStatus] = useState<"idle" | "ready" | "failed">(
    "idle",
  );
  const handleGlbReady = useCallback(() => {
    setGlbStatus("ready");
    onReady?.();
  }, [onReady]);
  const handleGlbError = useCallback(() => setGlbStatus("failed"), []);
  const glbFailed = glbStatus === "failed";
  const showGlb = Boolean(modelUrl && GlbTrophy && !glbFailed);
  const showPlaceholder = !modelUrl || glbFailed;

  useEffect(() => {
    if (!modelUrl) {
      setGlbTrophy(null);
      setGlbStatus("idle");
      return;
    }
    let cancelled = false;
    setGlbStatus("idle");
    void import("./GlbTrophy")
      .then((mod) => {
        if (!cancelled) setGlbTrophy(() => mod.GlbTrophy);
      })
      .catch(() => {
        if (!cancelled) setGlbStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

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

  // Vitrine frames the shared mesh. Other pages keep the original camera.
  const fov = transparent ? (isSmall ? 34 : 32) : isSmall ? 40 : 50;
  const cameraPosition: [number, number, number] = fitBounds
    ? fittedCameraPosition(fov)
    : transparent
      ? isSmall
        ? [0, 0.28, 4.6]
        : [0, 0.08, 2.85]
      : isSmall
        ? [0, 0.5, 3]
        : [0, 0.8, 4];
  const lookAt = fitBounds
    ? FITTED_LOOK_AT
    : ([0, transparent ? (isSmall ? 0.18 : 0.48) : 0, 0] as [
        number,
        number,
        number,
      ]);

  const posterImage = posterUrl ? (
    // Still posters are static assets; next/image is not required here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={posterUrl}
      alt=""
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  ) : null;

  const fillFrame = isSmall || fitBounds;
  const stageStyle = {
    width: "100%",
    height: fitBounds ? "auto" : "100%",
    ...(fillFrame ? {} : { minHeight: "400px" }),
    ...(fitBounds ? { flex: "1 1 0", minHeight: 0 } : {}),
    position: "relative" as const,
  };

  if (!mounted) {
    return (
      <div
        className={className}
        style={{
          ...stageStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: transparent ? "transparent" : "#1A1A19",
        }}
      >
        {posterImage ?? (
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
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...stageStyle,
        touchAction: isInteractive ? "none" : "auto",
      }}
    >
      <Canvas
        camera={{
          position: cameraPosition,
          fov,
        }}
        frameloop={frameloop}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference,
        }}
        dpr={pixelRatio}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          background: "transparent",
        }}
        shadows={Boolean(modelUrl) && !isSmall}
        onCreated={({ gl, scene, camera }) => {
          camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
          if (modelUrl) {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
            gl.outputColorSpace = SRGBColorSpace;
          }
          if (!transparent) return;
          scene.background = null;
          gl.setClearColor(0x000000, 0);
        }}
      >
        {showPlaceholder && !posterUrl ? (
          <>
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
          </>
        ) : null}

        <Suspense fallback={<LoadingFallback />}>
          {showGlb && modelUrl && GlbTrophy ? (
            <GlbTrophy
              url={modelUrl}
              rarity={rarity}
              autoRotate={autoRotate}
              size={size}
              compact={compact}
              fitBounds={fitBounds}
              onReady={handleGlbReady}
              onError={handleGlbError}
            />
          ) : null}
          {showPlaceholder && !posterUrl ? (
            <TrophyModel
              rarity={rarity}
              autoRotate={autoRotate}
              entropy={entropy}
              season={season}
              softBase={transparent}
            />
          ) : null}
        </Suspense>

        {/* Seasonal Particles - only for large views (performance) */}
        {isLarge && particles ? (
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
      {posterUrl && glbStatus !== "ready" ? posterImage : null}
    </div>
  );
}
