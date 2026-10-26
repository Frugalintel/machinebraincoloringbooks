"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Trophy,
  Lock,
  Unlock,
  Scan,
  Star,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { pageH1Style } from "@/lib/h1-fit";
import { Input } from "@/components/ui/input";
import { useGame } from "@/context/game-context";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { supabase } from "@/lib/supabase";
import { resolveCollectibleUnlockFromDb } from "@/lib/collectible-unlock";
import { logger } from "@/lib/logger";

// Dynamic import for Three.js to avoid SSR issues
const TrophyCanvas = dynamic(
  () => import("@/components/three").then((m) => m.TrophyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[100px] bg-background animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 border border-primary/30 rounded-full animate-spin" />
      </div>
    ),
  },
);

export default function TrophyRoomPage() {
  const { user, openAuthModal, isLoading } = useAuth();
  const { collectionSets, unlockItem, collectibleTimestamps } = useGame();
  const { success, error: toastError } = useToast();
  const [code, setCode] = useState("");
  const [unlockedReward, setUnlockedReward] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("login");
      return;
    }

    if (!code.trim()) return;

    setLoading(true);
    setUnlockedReward(null);

    try {
      const enteredCode = code.trim().toUpperCase();

      // 1. Find the code in book_codes table
      const { data: codeData, error: findError } = await supabase
        .from("book_codes")
        .select("*")
        .eq("code", enteredCode)
        .eq("is_active", true)
        .single();

      if (findError || !codeData) {
        // If not found in book_codes, check if it's a legacy hardcoded check or just invalid
        // For now, assume strict DB check as requested by plan
        toastError("Invalid code sequence.");
        setLoading(false);
        return;
      }

      // 2. Check if already used by user
      const { data: existingEntry } = await supabase
        .from("user_codes")
        .select("id")
        .eq("user_id", user.id)
        .eq("code_id", codeData.id)
        .single();

      if (existingEntry) {
        toastError("Code already redeemed.");
        setLoading(false);
        return;
      }

      // 3. Redeem Code
      const { error: redeemError } = await supabase
        .from("user_codes")
        .insert([{ user_id: user.id, code_id: codeData.id }]);

      if (redeemError) {
        logger.error("Redeem error:", redeemError);
        toastError("Failed to redeem code. Please try again.");
        setLoading(false);
        return;
      }

      // 4. Handle Reward
      if (codeData.unlocks_type === "collectible" && codeData.unlocks_id) {
        const unlocked = await resolveCollectibleUnlockFromDb(
          supabase,
          codeData.unlocks_id,
        );

        if (unlocked) {
          unlockItem(unlocked.setId, unlocked.slug);
          success("Unlocked.");
          setUnlockedReward("Artifact Acquired");
        } else {
          logger.warn("Unlocked item not found in local sets:", {
            unlocks_id: codeData.unlocks_id,
          });
          success("Code accepted. Collection updated.");
        }
      } else {
        success("Code accepted.");
      }

      setCode("");
    } catch (error) {
      logger.error("Claim error:", error);
      toastError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <main id="main" className="shell-doc-main">
        <h1
          className="shell-h font-display"
          style={pageH1Style(["Trophy Room."])}
        >
          Trophy Room.
        </h1>
        {isLoading ? (
          <p className="shell-sub" aria-busy="true">
            Loading
          </p>
        ) : (
          <>
            <p className="shell-sub">Sign in to see what you have unlocked.</p>
            <Button
              onClick={() => openAuthModal("login")}
              className="mt-6 hit-44 bg-cream text-ink hover:bg-cream"
            >
              Sign in
            </Button>
          </>
        )}
      </main>
    );
  }

  return (
    <main id="main" className="min-h-screen bg-background text-cream font-sans">
      {/* Header Banner */}
      <div className="bg-background border-b border-line py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="mb-6">
            <Link href="/profile/me">
              <Button
                variant="ghost"
                className="pl-0 hover:bg-transparent hover:text-primary text-fg-muted font-mono text-xs uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={14} className="mr-2" /> Back to Profile
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
            <Trophy size={14} />
            <span>Your Collection</span>
          </div>
          <h1 className="font-display text-title text-cream mb-4">
            Your Collection
          </h1>
          <p className="font-mono text-sm text-fg-muted tracking-widest uppercase max-w-xl">
            Your digital rewards from coloring books.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Collection Sets */}
        <div className="lg:col-span-8 space-y-12">
          {Array.isArray(collectionSets) &&
            collectionSets.map((set) => {
              const isComplete = set.collected.length === set.total;
              const progress = (set.collected.length / set.total) * 100;

              return (
                <div
                  key={set.id}
                  className="border border-line bg-background p-6 md:p-8 relative overflow-hidden group"
                >
                  {/* Progress Bar */}
                  <div className="absolute top-0 left-0 h-1 bg-surface-2 w-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-cream"
                    />
                  </div>

                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-heading text-3xl text-cream tracking-wide mb-2">
                        {set.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-fg-muted uppercase tracking-widest">
                        <span>
                          Status: {isComplete ? "Complete" : "In Progress"}
                        </span>
                        <span className="text-primary">
                          [{set.collected.length}/{set.total}]
                        </span>
                      </div>
                    </div>
                    {isComplete ? (
                      <div className="bg-cream text-ink px-4 py-2 font-heading tracking-widest text-sm animate-pulse">
                        Set Complete
                      </div>
                    ) : null}
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {set.items.map((item) => {
                      const isCollected = set.collected.includes(item.id);
                      return (
                        <Link
                          href={`/collectibles/${item.id}`}
                          key={item.id}
                          className="block"
                        >
                          <div
                            className={`aspect-square border ${isCollected ? "border-primary/50 bg-background" : "border-line border-dashed bg-transparent"} relative flex flex-col items-center justify-center p-4 group/item transition-all hover:border-primary cursor-pointer h-full`}
                          >
                            {isCollected ? (
                              <>
                                <div className="absolute inset-0 z-0">
                                  <TrophyCanvas
                                    size="small"
                                    rarity={item.rarity}
                                    autoRotate={true}
                                    isInteractive={false}
                                    unlockedAt={
                                      collectibleTimestamps[item.id]?.unlockedAt
                                    }
                                    lastPolishedAt={
                                      collectibleTimestamps[item.id]
                                        ?.lastPolishedAt
                                    }
                                  />
                                </div>
                                <span className="absolute bottom-2 left-0 right-0 font-label text-fg-muted uppercase text-center z-10 group-hover/item:text-cream transition-colors">
                                  {item.name}
                                </span>
                                <div className="absolute top-2 right-2 text-primary z-10">
                                  <Star size={10} fill="currentColor" />
                                </div>
                              </>
                            ) : (
                              <>
                                <Lock className="w-6 h-6 text-fg-faint mb-2 group-hover/item:text-fg-muted transition-colors" />
                                <span className=" font-label text-fg-faint uppercase text-center group-hover/item:text-fg-muted transition-colors">
                                  Locked
                                </span>
                              </>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Right: Code Input & Reward */}
        <div className="lg:col-span-4 space-y-8">
          {/* Code Input */}
          <div className="bg-background border border-line p-6 md:p-8 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-transparent"></div>
            <h3 className="font-heading text-xl text-cream mb-6 flex items-center gap-2">
              <Scan size={18} className="text-primary" /> Enter a code
            </h3>

            <form onSubmit={handleClaim} className="space-y-4">
              <div className="space-y-2">
                <label className=" uppercase tracking-widest text-primary font-label">
                  Code
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="shell-focus bg-background border-line text-cream font-mono text-lg tracking-[0.5em] uppercase h-14 text-center focus:border-cream focus:ring-0 rounded-none placeholder:text-fg-muted"
                  placeholder="CODE"
                  maxLength={12}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-surface-2 hover:bg-cream hover:text-ink text-cream font-heading tracking-widest rounded-none transition-all"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Unlock size={16} className="mr-2" />
                )}
                {loading ? "Verifying..." : "Submit"}
              </Button>
            </form>
          </div>

          {/* Reward Preview */}
          <AnimatePresence>
            {unlockedReward ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-gradient-to-b from-background to-background border border-primary/50 p-8 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,79,0,0.15),transparent)] animate-pulse"></div>

                <Trophy size={48} className="mx-auto text-primary mb-4" />
                <h3 className="font-heading text-2xl text-cream tracking-wide mb-2">
                  Unlocked
                </h3>
                <p className="text-primary font-mono text-sm uppercase tracking-widest mb-6">
                  {unlockedReward}
                </p>

                <div className="w-full aspect-square bg-background border border-line relative mb-4 overflow-hidden">
                  {/* 3D Trophy Model */}
                  <TrophyCanvas
                    size="large"
                    rarity="Legendary"
                    autoRotate={true}
                    isInteractive={true}
                  />
                  <div className="absolute bottom-4 left-0 right-0 text-center font-label text-fg-muted uppercase pointer-events-none">
                    Drag to Rotate
                  </div>
                </div>

                <Button className="w-full border border-primary text-primary hover:bg-cream hover:text-ink bg-transparent font-heading tracking-widest text-xs h-10 rounded-none">
                  View in 3D
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
