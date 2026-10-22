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
          <div className="h-8 w-4 bg-cream"></div>
          <div>
            <h2 className="font-heading text-h2 text-cream">Your collection</h2>
            <span className="font-label mt-1 block tracking-[0.08em] text-fg-muted">
              Digital rewards from your books
            </span>
          </div>
        </div>

        {user ? (
          <Link href="/trophy-room">
            <Button
              variant="outline"
              className="border-line hover:border-primary text-xs font-mono uppercase tracking-widest hidden md:flex"
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
            relative overflow-hidden bg-background border transition-all duration-500 min-h-[400px] flex flex-col
            ${isHovering ? "border-cream/20" : "border-line"}
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
                      size="large"
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
                  <div className="text-center text-fg-faint">
                    <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-mono uppercase tracking-widest">
                      Select a set
                    </p>
                  </div>
                )}
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-linear-to-t from-background via-black/80 to-transparent pointer-events-none">
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
                              <Lock size={12} className="text-fg-muted" />
                            )}
                            <span
                              className={` font-label uppercase tracking-widest ${displayCollectible.isCollected ? "text-primary" : "text-fg-muted"}`}
                            >
                              {displayCollectible.isCollected
                                ? "Collected"
                                : "Locked"}
                            </span>
                          </div>
                          <h3 className="font-heading text-3xl text-cream tracking-tight">
                            {displayCollectible.name}
                          </h3>
                          <p className="text-xs text-fg-muted font-mono uppercase mt-1">
                            {activeSet?.title} Collection
                          </p>
                        </div>

                        {/* Rarity Badge */}
                        <div
                          className={`
 px-2 py-1 font-label uppercase tracking-widest border
                          ${
                            displayCollectible.rarity === "Legendary"
                              ? "border-signal text-signal bg-cream/5"
                              : displayCollectible.rarity === "Epic"
                                ? "border-line text-signal bg-cream/5"
                                : displayCollectible.rarity === "Rare"
                                  ? "border-blue-500 text-fg-muted bg-cream/5"
                                  : "border-gray-700 text-fg-muted bg-surface-2/10"
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
              <div className="w-20 h-20 bg-background border border-line rounded-full flex items-center justify-center mb-6 relative group-hover:border-primary/50 transition-colors">
                <Lock
                  size={32}
                  className="text-fg-faint group-hover:text-primary transition-colors"
                />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-cream rounded-full animate-pulse"></div>
              </div>
              <h3 className="font-heading text-h3 mb-2 text-cream">
                Hidden treasures
              </h3>
              <p className="text-fg-muted font-mono text-xs uppercase tracking-widest max-w-xs">
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
                  <span className="font-heading text-xl text-cream">
                    {collectedInSet.length}
                  </span>
                  <span className=" text-fg-muted font-label uppercase tracking-widest">
                    Items
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-xl text-cream">
                    {completedSetIds.length}
                  </span>
                  <span className=" text-fg-muted font-label uppercase tracking-widest">
                    Sets
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-xl text-primary">
                    {collectorScore}
                  </span>
                  <span className=" text-fg-muted font-label uppercase tracking-widest">
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
                            ? "bg-cream/5 border-cream/20"
                            : "bg-transparent border-line hover:bg-cream/5 hover:border-cream/10"
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        {/* Set Icon / Thumbnail */}
                        <div
                          className={`
                          w-12 h-12 rounded-sm flex items-center justify-center border
                          ${isActive ? "border-primary/30 bg-cream/10" : "border-line bg-background"}
                        `}
                        >
                          {isComplete ? (
                            <Trophy size={18} className="text-signal" />
                          ) : (
                            <Sparkles
                              size={18}
                              className={
                                isActive ? "text-primary" : "text-fg-faint"
                              }
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4
                              className={`
 font-heading text-sm tracking-wide transition-colors
                              ${isActive ? "text-cream" : "text-fg-muted group-hover:text-cream"}
                            `}
                            >
                              {item.set.title}
                            </h4>
                            {isComplete ? (
                              <div className="flex items-center gap-1 text-signal font-label uppercase">
                                <Check size={10} /> Complete
                              </div>
                            ) : null}
                          </div>

                          {/* Progress Bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${isComplete ? "bg-amber-500" : "bg-cream"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress.percent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                            <span className=" font-label text-fg-muted w-8 text-right">
                              {item.progress.collected}/{item.progress.total}
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          size={14}
                          className={`
                            transition-transform duration-300
                            ${isActive ? "text-primary translate-x-1" : "text-fg-faint group-hover:text-fg-muted"}
                          `}
                        />
                      </div>

                      {/* Active Indicator */}
                      {isActive ? (
                        <motion.div
                          layoutId="activeSetIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-cream shadow-[0_0_10px_rgba(255,255,255,0.3)]"
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
                    className="flex items-center gap-4 p-4 border border-line bg-background"
                  >
                    <div className="w-10 h-10 rounded-sm bg-background flex items-center justify-center border border-line">
                      <benefit.icon size={16} className="text-fg-muted" />
                    </div>
                    <div>
                      <h4 className="font-heading text-h3 text-cream">
                        {benefit.title}
                      </h4>
                      <p className="text-xs text-fg-muted font-mono">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto border-t border-line pt-6">
                <Button
                  onClick={() => openAuthModal("register")}
                  className="w-full h-12 bg-cream text-ink hover:bg-cream font-heading tracking-widest text-lg rounded-none mb-3"
                >
                  Start Collecting
                </Button>
                <p className="text-center text-fg-muted font-label uppercase">
                  Already have an account?{" "}
                  <button
                    onClick={() => openAuthModal("login")}
                    className="text-cream hover:text-primary underline decoration-1 underline-offset-4"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* CTA Footer (Code Entry) - Only for Logged In Users */}
          {user ? (
            <div className="mt-auto pt-6 border-t border-line">
              <div className="bg-background border border-line p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-heading text-sm text-cream ">
                        Have a code?
                      </span>
                      <span className=" text-fg-muted font-label uppercase tracking-widest">
                        Find it on the back page
                      </span>
                    </div>
                    <Link
                      href="/scan"
                      className=" font-label text-fg-muted hover:text-primary flex items-center gap-1 transition-colors"
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
