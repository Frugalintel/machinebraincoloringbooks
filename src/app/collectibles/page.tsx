"use client";

import { motion } from "framer-motion";
import {
  Box,
  Lock,
  ArrowRight,
  UserPlus,
  Trophy,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { collectionSets, achievements } from "@/lib/game-data";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";

// Dynamic import for 3D trophy canvas
const TrophyCanvas = dynamic(
  () => import("@/components/three").then((m) => m.TrophyCanvas),
  { ssr: false },
);

export default function CollectiblesPublicPage() {
  const { user, openAuthModal } = useAuth();
  const { collectionSets: userCollectionSets, collectibleTimestamps } =
    useGame();

  // Get all unlocked collectibles with their data
  const unlockedCollectibles = useMemo(() => {
    const unlocked: Array<{
      id: string;
      name: string;
      rarity: string;
      setId: string;
      unlockedAt?: string;
    }> = [];
    userCollectionSets.forEach((set) => {
      set.items.forEach((item) => {
        if (set.collected.includes(item.id)) {
          unlocked.push({
            id: item.id,
            name: item.name,
            rarity: item.rarity,
            setId: set.id,
            unlockedAt: collectibleTimestamps[item.id]?.unlockedAt,
          });
        }
      });
    });
    return unlocked.sort((a, b) => {
      if (!a.unlockedAt) return 1;
      if (!b.unlockedAt) return -1;
      return (
        new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
      );
    });
  }, [userCollectionSets, collectibleTimestamps]);

  // Most recently unlocked collectible
  const recentCollectible = unlockedCollectibles[0];

  // Helper to check if an item is collected by the current user
  const isItemCollected = (itemId: string) => {
    return userCollectionSets.some((set) => set.collected.includes(itemId));
  };

  return (
    <main className="min-h-screen bg-background text-cream font-sans">
      {/* Hero Section */}
      <div className="bg-background border-b border-line py-12 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-cream/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full"
          >
            <div className="flex flex-col md:flex-row items-end gap-8 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
                  <Trophy size={14} />
                  <span>Rewards</span>
                </div>
                <h1 className="font-display text-title text-cream mb-4">
                  <span className="text-primary">Collectibles</span>
                </h1>
                <p className="font-mono text-sm text-fg-muted tracking-widest uppercase max-w-xl leading-relaxed">
                  Digital rewards you can unlock by entering codes from your
                  coloring books.
                </p>
              </div>

              {/* Featured Trophy Preview - show recent unlock if user is logged in and has collectibles */}
              {user && recentCollectible ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-40 h-40 bg-background border border-line relative overflow-hidden flex-shrink-0"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-amber-500 to-transparent"></div>
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 text-primary font-label uppercase tracking-widest">
                    <Sparkles size={8} />
                    <span>Recent</span>
                  </div>
                  <TrophyCanvas
                    size="small"
                    rarity={recentCollectible.rarity}
                    autoRotate={true}
                    isInteractive={false}
                    unlockedAt={recentCollectible.unlockedAt}
                    lastPolishedAt={
                      collectibleTimestamps[recentCollectible.id]
                        ?.lastPolishedAt
                    }
                  />
                </motion.div>
              ) : null}
            </div>

            {!user ? (
              <Button
                onClick={() => openAuthModal("register")}
                className="bg-cream text-ink hover:bg-cream hover:text-ink font-heading tracking-widest px-8 py-6 rounded-none text-lg transition-all transform hover:scale-105"
              >
                <UserPlus className="mr-2" size={20} /> Create account
              </Button>
            ) : (
              <Link href="/trophy-room">
                <Button className="bg-cream text-ink hover:bg-cream hover:text-ink font-heading tracking-widest px-8 py-6 rounded-none text-lg">
                  Go to Trophy Room <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 md:px-6 py-20">
        {collectionSets.map((set, setIndex) => (
          <div key={set.id} className="mb-24 last:mb-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-line pb-4">
              <div>
                <span className="text-primary font-mono text-xs uppercase tracking-[0.2em] mb-2 block">
                  Set {setIndex + 1}
                </span>
                <h2 className="font-heading text-4xl text-cream">
                  {set.title}
                </h2>
              </div>
              <div className="text-right hidden md:block">
                <p className="font-mono text-xs text-fg-muted uppercase tracking-widest">
                  Total Artifacts
                </p>
                <p className="font-heading text-2xl">{set.total}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {set.items.map((item) => {
                const relatedAch = item.relatedAchievementId
                  ? achievements.find((a) => a.id === item.relatedAchievementId)
                  : null;

                return (
                  <Link
                    href={`/collectibles/${item.id}`}
                    key={item.id}
                    className="block h-full"
                  >
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="group relative bg-background border border-line p-6 hover:border-primary/50 transition-colors overflow-hidden flex flex-col h-full"
                    >
                      {/* Item Preview */}
                      <div className="aspect-square bg-background mb-6 relative flex items-center justify-center overflow-hidden border border-line group-hover:border-primary/20 flex-shrink-0">
                        {isItemCollected(item.id) ? (
                          <>
                            <div className="w-full h-full">
                              <TrophyCanvas
                                size="small"
                                rarity={item.rarity}
                                autoRotate={true}
                                isInteractive={false}
                                unlockedAt={
                                  collectibleTimestamps[item.id]?.unlockedAt
                                }
                                lastPolishedAt={
                                  collectibleTimestamps[item.id]?.lastPolishedAt
                                }
                              />
                            </div>
                            {/* Collected badge */}
                            <div className="absolute top-2 right-2 z-10 bg-cream/90 text-ink px-2 py-1 font-label uppercase tracking-widest">
                              Collected
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className={`w-24 h-24 rounded-full ${item.image} blur-2xl opacity-40 absolute group-hover:opacity-60 transition-opacity`}
                            ></div>
                            <Box
                              className="w-12 h-12 text-fg-secondary relative z-10 group-hover:scale-110 transition-transform duration-500"
                              strokeWidth={1}
                            />
                          </>
                        )}

                        {/* Overlay Info on Hover - Simplified to just show it's interactive if there's detailed data */}
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 text-center pointer-events-none">
                          <p className=" text-primary uppercase tracking-widest font-label mb-2">
                            View Details
                          </p>
                          <p className="text-xs text-cream font-mono leading-relaxed">
                            Click to inspect artifact
                          </p>
                        </div>
                      </div>

                      {/* Info & Action Area */}
                      <div className="flex-1 flex flex-col">
                        <h3 className="font-heading text-xl text-cream mb-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest mb-4">
                          {isItemCollected(item.id) ? (
                            <span className="text-primary flex items-center gap-2">
                              <Trophy size={12} /> Owned
                            </span>
                          ) : (
                            <span className="text-fg-muted flex items-center gap-2">
                              <Lock size={12} /> Locked
                            </span>
                          )}
                        </div>

                        {/* Expanded Details Area (Always visible if related achievement exists, or just cleaner layout) */}
                        {relatedAch ? (
                          <div className="mt-auto pt-4 border-t border-line">
                            <div className="flex items-center gap-2 mb-2 text-fg-muted">
                              <Trophy size={12} className="text-primary" />
                              <span className=" font-label uppercase tracking-wide">
                                Linked Mission
                              </span>
                            </div>
                            <p className="text-xs text-fg-secondary font-mono mb-3 line-clamp-2">
                              {relatedAch.description}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {/* Decorative Corner */}
                      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-line group-hover:border-primary/50 transition-colors pointer-events-none"></div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Footer */}
      {!user && (
        <div className="bg-cream/10 border-t border-line py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl md:text-5xl text-cream mb-6">
              Start collecting
            </h2>
            <p className="text-fg-muted font-mono text-sm max-w-xl mx-auto mb-8 uppercase tracking-widest">
              Create an account to save your progress and unlock rewards.
            </p>
            <Button
              onClick={() => openAuthModal("register")}
              className="bg-cream text-ink hover:bg-cream font-heading tracking-widest px-10 py-6 rounded-none text-xl"
            >
              Create account
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
