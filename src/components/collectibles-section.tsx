"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Lock,
  Trophy,
  ArrowRight,
  Sparkles,
  Check,
  ChevronRight,
  Scan,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useCollectibles } from "@/context/game-context";
import { CodeEntry } from "@/components/code-entry";
import { Button } from "@/components/ui/button";
import { getSetProgress } from "@/lib/game-engine";

const TrophyCanvas = dynamic(
  () => import("@/components/three").then((m) => m.TrophyCanvas),
  { ssr: false },
);

export function CollectiblesSection() {
  const { user, openAuthModal } = useAuth();
  const { collectionSets, allCollectibles, collectorScore, completedSetIds } =
    useCollectibles();

  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Sort sets by progress/activity to determine default order
  // For now, we'll just keep the default order but ensure we have valid data
  const setsWithProgress = collectionSets.map((set) => ({
    set,
    progress: getSetProgress(
      allCollectibles.filter((c) => c.isCollected).map((c) => c.id),
      set,
    ),
  }));

  // Determine active set and its display collectible
  const activeSetData = setsWithProgress[activeSetIndex];
  const activeSet = activeSetData?.set;

  // Find a collectible to show for this set (prioritize collected ones, then first available)
  const setCollectibles = allCollectibles.filter(
    (c) => c.setId === activeSet?.id,
  );
  const collectedInSet = setCollectibles.filter((c) => c.isCollected);

  // If we have collected items in this set, show the most recent one.
  // Otherwise show the first one (locked state).
  const displayCollectible =
    collectedInSet.length > 0
      ? collectedInSet.sort((a, b) => {
          if (!a.timestamps?.unlockedAt) return 1;
          if (!b.timestamps?.unlockedAt) return -1;
          return (
            new Date(b.timestamps.unlockedAt).getTime() -
            new Date(a.timestamps.unlockedAt).getTime()
          );
        })[0]
      : setCollectibles[0];

  return (
    <section className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-8 w-4 bg-primary"></div>
          <div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tighter text-white leading-none">
              YOUR COLLECTION
            </h2>
            <span className="font-sans text-[10px] text-gray-500 tracking-[0.3em] uppercase block mt-1">
              Digital rewards from your books
            </span>
          </div>
        </div>

        {user ? (
          <Link href="/trophy-room">
            <Button
              variant="outline"
              className="border-[#333] hover:border-primary text-xs font-mono uppercase tracking-widest hidden md:flex"
            >
              <Trophy size={14} className="mr-2" />
              Open Trophy Room
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Showcase Area */}
        <div
          className={`
            relative overflow-hidden bg-[#0a0a0a] border transition-all duration-500 min-h-[400px] flex flex-col
            ${isHovering ? "border-white/20" : "border-[#222]"}
          `}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay"></div>

          {user ? (
            /* Logged In Showcase */
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                {displayCollectible ? (
                  <div className="w-full h-full">
                    <TrophyCanvas
                      size="medium"
                      rarity={displayCollectible.rarity}
                      autoRotate={true}
                      isInteractive={true}
                      unlockedAt={
                        displayCollectible.isCollected
                          ? displayCollectible.timestamps?.unlockedAt
                          : undefined
                      }
                      lastPolishedAt={
                        displayCollectible.timestamps?.lastPolishedAt
                      }
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-mono uppercase tracking-widest">
                      Select a set
                    </p>
                  </div>
                )}
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none">
                <AnimatePresence mode="wait">
                  {displayCollectible ? (
                    <motion.div
                      key={displayCollectible.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {!displayCollectible.isCollected && (
                              <Lock size={12} className="text-gray-500" />
                            )}
                            <span
                              className={`text-[10px] font-mono uppercase tracking-widest ${displayCollectible.isCollected ? "text-primary" : "text-gray-500"}`}
                            >
                              {displayCollectible.isCollected
                                ? "Collected"
                                : "Locked"}
                            </span>
                          </div>
                          <h3 className="font-heading text-3xl text-white uppercase tracking-tight">
                            {displayCollectible.name}
                          </h3>
                          <p className="text-xs text-gray-400 font-mono uppercase mt-1">
                            {activeSet?.title} Collection
                          </p>
                        </div>

                        {/* Rarity Badge */}
                        <div
                          className={`
                          px-2 py-1 text-[10px] font-mono uppercase tracking-widest border
                          ${
                            displayCollectible.rarity === "legendary"
                              ? "border-amber-500 text-amber-500 bg-amber-500/10"
                              : displayCollectible.rarity === "epic"
                                ? "border-purple-500 text-purple-500 bg-purple-500/10"
                                : displayCollectible.rarity === "rare"
                                  ? "border-blue-500 text-blue-500 bg-blue-500/10"
                                  : "border-gray-700 text-gray-500 bg-gray-500/10"
                          }
                        `}
                        >
                          {displayCollectible.rarity}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* Logged Out Placeholder */
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
              <div className="w-20 h-20 bg-[#0a0a0a] border border-[#333] rounded-full flex items-center justify-center mb-6 relative group-hover:border-primary/50 transition-colors">
                <Lock
                  size={32}
                  className="text-gray-600 group-hover:text-primary transition-colors"
                />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full animate-pulse"></div>
              </div>
              <h3 className="font-heading text-2xl text-white uppercase mb-2">
                Hidden Treasures
              </h3>
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest max-w-xs">
                Digital rewards await inside every book
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive List & Actions */}
        <div className="flex flex-col h-full">
          {user ? (
            /* Logged In List */
            <>
              {/* Inline Stats */}
              <div className="flex items-center gap-6 mb-4 px-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-xl text-white">
                    {collectedInSet.length}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                    Items
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-xl text-white">
                    {completedSetIds.length}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                    Sets
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-xl text-primary">
                    {collectorScore}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                    Points
                  </span>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
                {setsWithProgress.map((item, index) => {
                  const isActive = index === activeSetIndex;
                  const isComplete = item.progress.isComplete;

                  return (
                    <button
                      key={item.set.id}
                      onClick={() => setActiveSetIndex(index)}
                      className={`
                        group relative w-full text-left p-4 rounded-sm border transition-all duration-300
                        ${
                          isActive
                            ? "bg-white/5 border-white/20"
                            : "bg-transparent border-[#222] hover:bg-white/2 hover:border-white/10"
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        {/* Set Icon / Thumbnail */}
                        <div
                          className={`
                          w-12 h-12 rounded-sm flex items-center justify-center border
                          ${isActive ? "border-primary/30 bg-primary/10" : "border-[#333] bg-[#0a0a0a]"}
                        `}
                        >
                          {isComplete ? (
                            <Trophy size={18} className="text-amber-500" />
                          ) : (
                            <Sparkles
                              size={18}
                              className={
                                isActive ? "text-primary" : "text-gray-600"
                              }
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4
                              className={`
                              font-heading text-sm uppercase tracking-wide transition-colors
                              ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200"}
                            `}
                            >
                              {item.set.title}
                            </h4>
                            {isComplete ? (
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-mono uppercase">
                                <Check size={10} /> Complete
                              </div>
                            ) : null}
                          </div>

                          {/* Progress Bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1 bg-[#222] rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${isComplete ? "bg-amber-500" : "bg-primary"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress.percent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 w-8 text-right">
                              {item.progress.collected}/{item.progress.total}
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          size={14}
                          className={`
                            transition-transform duration-300
                            ${isActive ? "text-primary translate-x-1" : "text-gray-700 group-hover:text-gray-500"}
                          `}
                        />
                      </div>

                      {/* Active Indicator */}
                      {isActive ? (
                        <motion.div
                          layoutId="activeSetIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Logged Out Benefits List */
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1 space-y-4">
                {[
                  {
                    title: "Track Progress",
                    desc: "See your collection grow as you read",
                    icon: Sparkles,
                  },
                  {
                    title: "Unlock Rewards",
                    desc: "Get exclusive digital trophies",
                    icon: Trophy,
                  },
                  {
                    title: "Join the Community",
                    desc: "Compare stats with other readers",
                    icon: ArrowRight,
                  },
                ].map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 border border-[#222] bg-[#0a0a0a]"
                  >
                    <div className="w-10 h-10 rounded-sm bg-[#111] flex items-center justify-center border border-[#222]">
                      <benefit.icon size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-heading text-sm text-white uppercase">
                        {benefit.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto border-t border-[#222] pt-6">
                <Button
                  onClick={() => openAuthModal("register")}
                  className="w-full h-12 bg-primary text-black hover:bg-white font-heading uppercase tracking-widest text-lg rounded-none mb-3"
                >
                  Start Collecting
                </Button>
                <p className="text-center text-[10px] text-gray-500 font-mono uppercase">
                  Already have an account?{" "}
                  <button
                    onClick={() => openAuthModal("login")}
                    className="text-white hover:text-primary underline decoration-1 underline-offset-4"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* CTA Footer (Code Entry) - Only for Logged In Users */}
          {user ? (
            <div className="mt-auto pt-6 border-t border-[#222]">
              <div className="bg-[#0a0a0a] border border-[#222] p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-heading text-sm text-white uppercase">
                        Have a code?
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                        Find it on the back page
                      </span>
                    </div>
                    <Link
                      href="/scan"
                      className="text-[10px] font-mono text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Scan size={12} />
                      Or scan page
                    </Link>
                  </div>
                  <CodeEntry />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
