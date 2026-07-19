"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  Trophy,
  User,
  MapPin,
  Shield,
  Info,
  Scan,
  Box,
  ChevronRight,
  Zap,
  Sparkles,
  CloudSnow,
  Sun,
  Leaf,
  CloudRain,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { collectionSets, achievements } from "@/lib/game-data";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";
import {
  getTrophyEntropy,
  getCurrentSeason,
  getEntropyDescription,
  getSeasonDisplayInfo,
} from "@/lib/trophy-utils";

// Dynamic import for Three.js to avoid SSR issues
const TrophyCanvas = dynamic(
  () => import("@/components/three").then((m) => m.TrophyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-[#111] animate-pulse flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-primary/30 rounded-full animate-spin" />
      </div>
    ),
  },
);

// Season icon component
function SeasonIcon({ season, size = 14 }: { season: string; size?: number }) {
  switch (season) {
    case "Spring":
      return <CloudRain size={size} />;
    case "Summer":
      return <Sun size={size} />;
    case "Fall":
      return <Leaf size={size} />;
    case "Winter":
      return <CloudSnow size={size} />;
    default:
      return <Sun size={size} />;
  }
}

export default function CollectibleDetail() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();
  const {
    collectibleTimestamps,
    polishCollectible,
    collectionSets: userCollectionSets,
  } = useGame();
  const router = useRouter();
  const [isPolishing, setIsPolishing] = useState(false);

  // Find the collectible in the sets
  let collectible = null;
  let parentSet = null;

  for (const set of collectionSets) {
    const found = set.items.find((item) => item.id === id);
    if (found) {
      collectible = found;
      parentSet = set;
      break;
    }
  }

  if (!collectible) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="text-center">
          <h1 className="text-4xl text-primary mb-4">ERROR 404</h1>
          <p className="text-gray-500">ARTIFACT NOT FOUND IN ARCHIVES</p>
          <Link
            href="/collectibles"
            className="mt-8 inline-block border-b border-primary text-primary pb-1 hover:text-white transition-colors"
          >
            RETURN TO VAULT
          </Link>
        </div>
      </main>
    );
  }

  const relatedAchievement = collectible.relatedAchievementId
    ? achievements.find((a) => a.id === collectible.relatedAchievementId)
    : null;

  // Check if user has collected this item
  const userSet = userCollectionSets.find((s) => s.id === parentSet?.id);
  const isUnlocked = userSet?.collected.includes(collectible.id) || false;

  // Get timestamps for entropy calculation
  const timestamps = collectibleTimestamps[collectible.id];
  const entropy = getTrophyEntropy(
    timestamps?.unlockedAt,
    timestamps?.lastPolishedAt,
  );
  const entropyDescription = getEntropyDescription(entropy);
  const entropyPercent = Math.round(entropy * 100);

  // Get current season
  const currentSeason = getCurrentSeason();
  const seasonInfo = getSeasonDisplayInfo(currentSeason);

  // Rarity colors
  const rarityColors = {
    Common: "text-gray-400 border-gray-400",
    Uncommon: "text-green-400 border-green-400",
    Rare: "text-blue-400 border-blue-400",
    Epic: "text-purple-400 border-purple-400",
    Legendary: "text-orange-400 border-orange-400",
  };

  const rarityColor =
    rarityColors[collectible.rarity as keyof typeof rarityColors] ||
    "text-white border-white";

  const handleAchievementClick = () => {
    if (!user) {
      openAuthModal("register");
    } else if (relatedAchievement) {
      router.push(`/achievements#${relatedAchievement.id}`);
    }
  };

  const handlePolish = async () => {
    if (!user || !isUnlocked || isPolishing) return;

    setIsPolishing(true);
    try {
      await polishCollectible(collectible.id);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black flex flex-col">
      {/* Breadcrumb / Header */}
      <div className="border-b border-[#222] bg-[#0a0a0a] pt-32 pb-6">
        <div className="container mx-auto px-4 md:px-6 flex items-center gap-4 text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest">
          <Link
            href="/collectibles"
            className="hover:text-primary flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={12} /> VAULT
          </Link>
          <ChevronRight size={10} className="text-[#333]" />
          <span className="text-white hover:text-primary transition-colors cursor-pointer">
            {parentSet?.title}
          </span>
          <ChevronRight size={10} className="text-[#333]" />
          <span className="text-primary">{collectible.name}</span>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left: Visuals */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative aspect-square w-full bg-[#111] border border-[#222] overflow-hidden rounded-sm shadow-2xl">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-10"></div>

              {/* Three.js Trophy Viewport with entropy and season */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <TrophyCanvas
                  size="large"
                  rarity={collectible.rarity}
                  isInteractive={true}
                  autoRotate={true}
                  unlockedAt={timestamps?.unlockedAt}
                  lastPolishedAt={timestamps?.lastPolishedAt}
                />
              </motion.div>

              {/* Season Badge - Top Left */}
              <div className="absolute top-6 left-6 z-20">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest rounded-full backdrop-blur-sm">
                  <SeasonIcon season={currentSeason} size={12} />
                  <span>{seasonInfo.name}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-primary">{seasonInfo.effect}</span>
                </div>
              </div>

              {/* Interaction Hint */}
              <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-mono text-gray-500 uppercase tracking-widest z-20 pointer-events-none">
                Drag to Rotate • Scroll to Zoom
              </div>

              {/* Status Badge - Top Right */}
              <div className="absolute top-6 right-6 z-20">
                {user && isUnlocked ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-500/30 text-green-500 text-[10px] font-mono uppercase tracking-widest rounded-full">
                    <Shield size={10} /> Authenticated
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-black/50 border border-white/10 text-gray-400 text-[10px] font-mono uppercase tracking-widest rounded-full backdrop-blur-sm">
                    <Lock size={10} /> {user ? "Locked" : "Restricted"}
                  </div>
                )}
              </div>
            </div>

            {/* Entropy/Condition Panel */}
            {user && isUnlocked ? (
              <div className="bg-[#0a0a0a] border border-[#222] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                      Trophy Condition
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-widest ${
                      entropy < 0.25
                        ? "text-green-400"
                        : entropy < 0.5
                          ? "text-yellow-400"
                          : entropy < 0.75
                            ? "text-orange-400"
                            : "text-red-400"
                    }`}
                  >
                    {entropyDescription}
                  </span>
                </div>

                {/* Entropy Progress Bar */}
                <div className="h-2 bg-[#222] w-full overflow-hidden rounded-full mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - entropyPercent}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${
                      entropy < 0.25
                        ? "bg-green-500"
                        : entropy < 0.5
                          ? "bg-yellow-500"
                          : entropy < 0.75
                            ? "bg-orange-500"
                            : "bg-red-500"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-gray-600">
                    {entropyPercent}% wear accumulated
                  </span>

                  {/* Polish Button */}
                  <Button
                    onClick={handlePolish}
                    disabled={isPolishing || entropy < 0.1}
                    size="sm"
                    className={`h-8 text-[9px] uppercase tracking-widest font-mono ${
                      entropy < 0.1
                        ? "bg-[#222] text-gray-600 cursor-not-allowed"
                        : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-black"
                    }`}
                  >
                    <Sparkles size={10} className="mr-1" />
                    {isPolishing
                      ? "Polishing..."
                      : entropy < 0.1
                        ? "Pristine"
                        : "Polish Trophy"}
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Technical Specs Grid */}
            <div className="grid grid-cols-3 gap-px bg-[#333] border border-[#222]">
              <div className="bg-[#0f0f0f] p-4 flex flex-col gap-1 items-center text-center">
                <Scan size={14} className="text-gray-500 mb-1" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">
                  Format
                </span>
                <span className="text-white font-mono text-xs">.DAT</span>
              </div>
              <div className="bg-[#0f0f0f] p-4 flex flex-col gap-1 items-center text-center">
                <Box size={14} className="text-gray-500 mb-1" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">
                  Size
                </span>
                <span className="text-white font-mono text-xs">12 MB</span>
              </div>
              <div className="bg-[#0f0f0f] p-4 flex flex-col gap-1 items-center text-center">
                <Shield size={14} className="text-gray-500 mb-1" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">
                  Hash
                </span>
                <span className="text-white font-mono text-xs">#A7X-9</span>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border ${rarityColor} bg-transparent rounded-sm`}
                >
                  {collectible.rarity || "Unknown"}
                </span>
                <div className="h-px w-8 bg-gray-800"></div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  {collectible.type || "Artifact"} {"//"}{" "}
                  {collectible.generation || "GEN-0"}
                </span>
              </div>

              <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase leading-[0.9] text-white mb-8 tracking-tight">
                {collectible.name}
              </h1>

              {/* Backstory / Lore Box */}
              <div className="bg-[#111] border-l-4 border-primary p-6 md:p-8 mb-8 relative">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                  <Info size={40} />
                </div>
                <h3 className="text-xs font-mono text-primary uppercase tracking-widest mb-3">
                  Database Entry // Lore
                </h3>
                <p className="text-gray-300 font-sans leading-relaxed text-sm md:text-lg">
                  {collectible.lore ||
                    "No historical data available for this artifact."}
                </p>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 font-mono">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  <span>
                    Origin:{" "}
                    <span className="text-white">
                      {collectible.foundIn || "Unknown"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* UNLOCK PROTOCOL / REQUIREMENTS (VISIBLE TO ALL) */}
            <div className="mb-8">
              <h3 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap size={14} className="text-primary" /> Unlock Protocol
              </h3>

              <div
                onClick={handleAchievementClick}
                className={`bg-[#0a0a0a] border border-[#222] p-6 hover:border-primary transition-colors group cursor-pointer relative overflow-hidden`}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors"></div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-heading text-xl text-white uppercase mb-2 group-hover:text-primary transition-colors">
                      {relatedAchievement
                        ? relatedAchievement.title
                        : "Classified Requirement"}
                    </h4>
                    <p className="text-sm text-gray-400 font-mono">
                      {collectible.requirement}
                    </p>

                    {relatedAchievement ? (
                      <div className="mt-4 flex items-center gap-2 text-[10px] text-primary uppercase tracking-widest font-mono">
                        <span>View Mission Intel</span>
                        <ArrowLeft
                          size={10}
                          className="rotate-180 group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {relatedAchievement ? (
                      <div className="bg-[#151515] p-2 rounded border border-[#222] group-hover:border-primary/30 transition-colors">
                        <Trophy className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                    ) : null}
                    {!user && (
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 uppercase tracking-widest">
                        Login to Track
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Data Section (PRIVATE) */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl text-white uppercase flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  {user ? "Personal Archive" : "Encrypted Data"}
                </h2>
                {!user && (
                  <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                    <Lock size={10} /> Access Denied
                  </span>
                )}
              </div>

              <div className="border border-[#222] bg-[#0a0a0a] relative overflow-hidden group">
                {/* GUEST VIEW: BLURRED PREVIEW WITH CTA */}
                {!user && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center">
                    <Lock className="w-12 h-12 text-primary mb-4" />
                    <h3 className="font-heading text-2xl text-white uppercase mb-2">
                      Join the Hunt
                    </h3>
                    <p className="text-gray-300 font-mono text-xs uppercase tracking-widest max-w-sm mb-6 leading-relaxed">
                      Create an account to track your collection, unlock rare
                      artifacts, and earn rewards.
                    </p>
                    <Button
                      onClick={() => openAuthModal("register")}
                      className="bg-primary text-black hover:bg-white hover:text-black font-heading uppercase tracking-widest px-8 h-12 rounded-none transition-all transform hover:scale-105"
                    >
                      Initialize Neural Link
                    </Button>
                    <button
                      onClick={() => openAuthModal("login")}
                      className="mt-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest hover:text-white underline decoration-gray-700 underline-offset-4"
                    >
                      Already have access? Login
                    </button>
                  </div>
                )}

                <div
                  className={`p-6 md:p-8 ${!user ? "opacity-20 pointer-events-none filter blur-sm" : ""}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-3">
                        Status
                      </span>
                      <div className="flex items-center gap-3 p-3 bg-[#151515] border border-[#222]">
                        {isUnlocked ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                            <span className="text-green-500 font-bold uppercase tracking-wide text-sm">
                              Acquired
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-gray-400 font-bold uppercase tracking-wide text-sm">
                              Not Collected
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-3">
                        Requirement
                      </span>
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Trophy size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium leading-snug">
                            {collectible.requirement}
                          </p>
                          {relatedAchievement ? (
                            <div className="mt-2 text-xs text-gray-500 font-mono">
                              Linked:{" "}
                              <span className="text-gray-300">
                                {relatedAchievement.title}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Visual for Related Achievement */}
                  {relatedAchievement ? (
                    <div className="mt-8 pt-6 border-t border-[#222]">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                          Mission Progress
                        </span>
                        <span className="text-[10px] text-primary font-mono">
                          30%
                        </span>
                      </div>
                      <div className="h-2 bg-[#222] w-full overflow-hidden">
                        <div className="h-full bg-primary w-[30%] relative">
                          <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50"></div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Link
                          href={`/achievements#${relatedAchievement.id}`}
                          className="text-[10px] text-gray-500 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-widest font-mono"
                        >
                          View Mission Details{" "}
                          <ArrowLeft className="rotate-180" size={10} />
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
