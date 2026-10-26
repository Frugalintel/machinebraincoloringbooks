"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Zap,
  Lock,
  RefreshCw,
  ArrowUpDown,
  ArrowDownAZ,
  LayoutList,
  ArrowLeft,
  X,
  ArrowRightLeft,
  Sparkles,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SystemLoading } from "@/components/system-loading";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useAchievements, useGame } from "@/context/game-context";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { PillarScore, PillarProgressBar } from "@/components/game/PillarScore";
import { MilestonePreview } from "@/components/game/RewardBadge";
import { InvitationCard } from "@/components/game/InvitationCard";
import { ACHIEVEMENT_CATEGORY_BONUSES } from "@/lib/pillar-rewards";

// Dynamic import for 3D trophy canvas
const TrophyCanvas = dynamic(
  () => import("@/components/three").then((m) => m.TrophyCanvas),
  { ssr: false },
);

export default function AchievementsPage() {
  const { user, openAuthModal, isLoading } = useAuth();
  const {
    achievements,
    unlockedAchievements,
    activeAchievementIds,
    achievementScore,
    achievementMilestone,
    nextAchievementMilestone,
    loadoutSlots,
    toggleActiveAchievement,
    swapActiveAchievement,
  } = useAchievements();
  const { collectionSets, resetGameData } = useGame();

  const router = useRouter();
  const [sortMethod, setSortMethod] = useState<"default" | "name" | "status">(
    "default",
  );
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [pendingNewMission, setPendingNewMission] = useState<string | null>(
    null,
  );

  const isFull = activeAchievementIds.length >= loadoutSlots;

  // Calculate cross-pillar bonus info
  const activeCategories = activeAchievementIds.reduce(
    (acc, achId) => {
      Object.entries(ACHIEVEMENT_CATEGORY_BONUSES).forEach(
        ([category, config]) => {
          if (config.achievementIds.includes(achId)) {
            acc[category] = (acc[category] || 0) + config.bonus;
          }
        },
      );
      return acc;
    },
    {} as Record<string, number>,
  );

  // Handle swap initiation
  const handleActivateOrSwap = (achievementId: string) => {
    const isActive = activeAchievementIds.includes(achievementId);

    if (isActive) {
      toggleActiveAchievement(achievementId);
    } else if (isFull) {
      setPendingNewMission(achievementId);
      setSwapModalOpen(true);
    } else {
      toggleActiveAchievement(achievementId);
    }
  };

  const handleSwapConfirm = (oldId: string) => {
    if (pendingNewMission) {
      swapActiveAchievement(oldId, pendingNewMission);
      setSwapModalOpen(false);
      setPendingNewMission(null);
    }
  };

  const handleSwapCancel = () => {
    setSwapModalOpen(false);
    setPendingNewMission(null);
  };

  const handleViewCollectible = () => {
    router.push("/trophy-room");
  };

  if (isLoading) {
    return <SystemLoading variant="page" label="Loading" />;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background text-cream font-sans flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Lock className="w-12 h-12 text-fg-muted mx-auto" />
            <h1 className="font-display text-title text-cream">
              Restricted Access
            </h1>
            <p className="text-fg-muted font-mono text-xs max-w-xs mx-auto">
              Track achievements, earn standalone rewards, and customize your
              loadout.
            </p>
            <Button
              onClick={() => openAuthModal("login")}
              className="bg-cream text-ink hover:bg-cream"
            >
              Login Required
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const sortedAchievements = [...achievements].sort((a, b) => {
    if (sortMethod === "name") {
      return a.title.localeCompare(b.title);
    }
    if (sortMethod === "status") {
      const aActive = activeAchievementIds.includes(a.id);
      const bActive = activeAchievementIds.includes(b.id);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (!a.unlocked && b.unlocked) return -1;
      if (a.unlocked && !b.unlocked) return 1;
      return a.id.localeCompare(b.id);
    }
    return 0;
  });

  const getRelatedCollectible = (achId: string) => {
    for (const set of collectionSets) {
      for (const item of set.items) {
        if (item.relatedAchievementId === achId) {
          return item;
        }
      }
    }
    if (achId === "ach-02") return { name: "Any Set", image: "bg-surface-2" };
    return null;
  };

  return (
    <main className="min-h-screen bg-background text-cream font-sans">
      {/* Header */}
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

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
                <Trophy size={14} />
                <span>Achievements</span>
              </div>
              <h1 className="font-display text-title text-cream mb-4">
                Achievements
              </h1>
              <p className="font-mono text-sm text-fg-muted tracking-widest uppercase max-w-xl">
                Earn badges and rewards as you use your coloring books.
              </p>
            </div>

            {/* Stats Panel */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                {/* Achievement Score */}
                <PillarScore
                  pillar="achievement"
                  score={achievementScore}
                  size="sm"
                />

                {/* Active Slots */}
                <div className="bg-background border border-line p-3 flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-fg-muted uppercase tracking-widest">
                      Equipped
                    </p>
                    <p
                      className={`font-heading text-xl ${isFull ? "text-signal" : "text-primary"}`}
                    >
                      {activeAchievementIds.length} / {loadoutSlots}
                    </p>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${isFull ? "bg-amber-500" : "bg-success"}`}
                  ></div>
                </div>
              </div>

              {isFull ? (
                <p className=" text-signal/70 font-label uppercase tracking-widest text-center">
                  Swap mode enabled
                </p>
              ) : null}

              <Button
                onClick={resetGameData}
                variant="outline"
                className="border border-danger text-danger hover:bg-danger-strong hover:text-cream text-[10px] uppercase tracking-widest"
              >
                <RefreshCw size={12} className="mr-2" /> Reset Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Progress & Milestone */}
      <div className="bg-gradient-to-b from-background to-transparent border-b border-line">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Progress Overview */}
            <div className="bg-background border border-line p-6">
              <div className="flex items-center gap-2 text-signal font-label uppercase tracking-widest mb-4">
                <Star size={12} />
                <span>Achievement Progress</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-heading text-3xl text-cream">
                    {unlockedAchievements.length}
                  </span>
                  <span className="text-fg-muted font-mono text-sm">
                    / {achievements.length} unlocked
                  </span>
                </div>
                <PillarProgressBar
                  pillar="achievement"
                  current={unlockedAchievements.length}
                  max={achievements.length}
                  showValues={false}
                />
                {achievementMilestone ? (
                  <div className="pt-2 border-t border-line">
                    <span className=" text-fg-muted font-label">
                      Current Title:
                    </span>
                    <p className="text-signal font-heading ">
                      {achievementMilestone.reward.label}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Next Milestone */}
            {nextAchievementMilestone ? (
              <MilestonePreview
                current={unlockedAchievements.length}
                next={{
                  threshold: nextAchievementMilestone.threshold,
                  reward: nextAchievementMilestone.reward,
                }}
                pillarLabel="Achievement"
              />
            ) : null}

            {/* Cross-Pillar Bonus Preview */}
            {Object.keys(activeCategories).length > 0 && (
              <div className="bg-background border border-line p-6">
                <div className="flex items-center gap-2 text-primary font-label uppercase tracking-widest mb-4">
                  <Sparkles size={12} />
                  <span>Story Mode Bonuses</span>
                </div>
                <p className="text-[10px] text-fg-muted mb-3">
                  Your equipped achievements provide XP bonuses in Story Mode:
                </p>
                <div className="space-y-2">
                  {Object.entries(activeCategories).map(([category, bonus]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-fg-secondary">
                        {category} Stories
                      </span>
                      <span className="text-primary font-mono">
                        +{Math.round(bonus * 100)}% XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invitation to Stories (if no bonuses active) */}
            {Object.keys(activeCategories).length === 0 && (
              <InvitationCard
                type="stories"
                title="Story Mode Awaits"
                standaloneReward="Your achievements work standalone!"
                crossPillarInvitation="Equip themed achievements to earn +10% XP per achievement in matching story categories."
                ctaText="Explore Stories"
                ctaLink="/stories"
              />
            )}
          </div>
        </div>
      </div>

      {/* 3D Trophy Preview - Shows when user has unlocked achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="bg-background border-b border-line">
          <div className="container mx-auto px-4 md:px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-square max-w-[300px] mx-auto md:mx-0 bg-background border border-line overflow-hidden">
                <TrophyCanvas
                  size="large"
                  rarity={
                    unlockedAchievements.length >= 25
                      ? "Legendary"
                      : unlockedAchievements.length >= 10
                        ? "Epic"
                        : unlockedAchievements.length >= 5
                          ? "Rare"
                          : "Common"
                  }
                  autoRotate={true}
                  isInteractive={true}
                />
                <div className="absolute bottom-3 left-0 right-0 text-center font-label text-fg-muted uppercase pointer-events-none z-20">
                  Drag to Rotate
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-heading text-2xl text-cream ">
                  Achievement Trophy
                </h3>
                <p className="text-fg-muted font-mono text-sm">
                  Your trophy evolves as you unlock more achievements. Current
                  tier based on {unlockedAchievements.length} unlocked
                  achievements.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background border border-line p-4 text-center">
                    <p className="font-heading text-2xl text-cream">
                      {unlockedAchievements.length}
                    </p>
                    <p className=" text-fg-muted uppercase tracking-widest font-label">
                      Unlocked
                    </p>
                  </div>
                  <div className="bg-background border border-line p-4 text-center">
                    <p className="font-heading text-2xl text-cream">
                      {activeAchievementIds.length}
                    </p>
                    <p className=" text-fg-muted uppercase tracking-widest font-label">
                      Equipped
                    </p>
                  </div>
                  <div className="bg-background border border-line p-4 text-center">
                    <p className="font-heading text-2xl text-cream">
                      {achievementScore}
                    </p>
                    <p className=" text-fg-muted uppercase tracking-widest font-label">
                      Score
                    </p>
                  </div>
                </div>
                <Link href="/trophy-room">
                  <Button className="w-full bg-transparent border border-line text-signal hover:bg-cream hover:text-ink font-heading tracking-widest h-12 rounded-none">
                    <Trophy size={16} className="mr-2" /> View Trophy Room
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 py-12">
        {/* Active Loadout Preview (Sticky) */}
        <div className="mb-12 sticky top-20 z-30 bg-background/80 backdrop-blur-md border border-line p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl text-cream flex items-center gap-2">
              <Zap size={16} className="text-primary" /> Your badges
            </h3>
            <span className=" text-fg-muted font-label uppercase">
              {loadoutSlots} slots available
            </span>
          </div>
          <div
            className={`grid gap-4`}
            style={{ gridTemplateColumns: `repeat(${loadoutSlots}, 1fr)` }}
          >
            {Array.from({ length: loadoutSlots }).map((_, i) => {
              const activeId = activeAchievementIds[i];
              const ach = achievements.find((a) => a.id === activeId);

              return (
                <div
                  key={i}
                  className={`aspect-square md:aspect-auto md:h-24 border ${ach ? "border-primary/50 bg-background" : "border-line border-dashed bg-transparent"} flex flex-col items-center justify-center relative group`}
                >
                  {ach ? (
                    <>
                      <div className="text-primary mb-2 scale-75 md:scale-100">
                        <AchievementIcon icon={ach.icon} size={24} />
                      </div>
                      <span className=" md: font-label text-fg-muted uppercase text-center leading-tight px-1 hidden md:block">
                        {ach.title}
                      </span>
                      <button
                        onClick={() => toggleActiveAchievement(ach.id)}
                        className="absolute inset-0 bg-danger-strong text-cream opacity-0 group-hover:opacity-100 flex items-center justify-center uppercase font-bold text-[10px] tracking-widest transition-opacity"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className=" text-fg-faint uppercase font-label">
                      Empty
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={sortMethod === "default" ? "default" : "outline"}
            onClick={() => setSortMethod("default")}
            className={`text-[10px] uppercase tracking-widest h-8 ${sortMethod === "default" ? "bg-cream text-ink" : "border-line text-fg-muted"}`}
          >
            <ArrowUpDown size={12} className="mr-2" /> Default
          </Button>
          <Button
            variant={sortMethod === "name" ? "default" : "outline"}
            onClick={() => setSortMethod("name")}
            className={`text-[10px] uppercase tracking-widest h-8 ${sortMethod === "name" ? "bg-cream text-ink" : "border-line text-fg-muted"}`}
          >
            <ArrowDownAZ size={12} className="mr-2" /> Name
          </Button>
          <Button
            variant={sortMethod === "status" ? "default" : "outline"}
            onClick={() => setSortMethod("status")}
            className={`text-[10px] uppercase tracking-widest h-8 ${sortMethod === "status" ? "bg-cream text-ink" : "border-line text-fg-muted"}`}
          >
            <LayoutList size={12} className="mr-2" /> Status
          </Button>
        </div>

        {/* All Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAchievements.map((ach) => {
            const isActive = activeAchievementIds.includes(ach.id);
            const relatedCollectible = getRelatedCollectible(ach.id);

            return (
              <AchievementCard
                key={ach.id}
                achievement={ach}
                isActive={isActive}
                isFull={isFull}
                onToggle={handleActivateOrSwap}
                onViewCollectible={handleViewCollectible}
                relatedCollectible={relatedCollectible as never}
                variant="grid"
              />
            );
          })}
        </div>
      </div>

      {/* Swap Modal */}
      <AnimatePresence>
        {swapModalOpen && pendingNewMission ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleSwapCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-background border border-line w-full max-w-lg relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-line p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-warning/10 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-signal font-label uppercase tracking-widest mb-2">
                      <ArrowRightLeft size={12} /> Swap Mission
                    </div>
                    <h3 className="font-heading text-xl text-cream ">
                      Select Mission to Replace
                    </h3>
                  </div>
                  <button
                    onClick={handleSwapCancel}
                    className="w-8 h-8 flex items-center justify-center border border-line text-fg-muted hover:text-cream hover:border-cream transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {(() => {
                const newMission = achievements.find(
                  (a) => a.id === pendingNewMission,
                );
                if (!newMission) return null;
                return (
                  <div className="p-4 border-b border-line bg-background">
                    <p className="text-[10px] text-fg-muted uppercase tracking-widest mb-2">
                      Incoming Mission
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center border border-success/50 text-success bg-success/10">
                        <AchievementIcon icon={newMission.icon} size={16} />
                      </div>
                      <div>
                        <h4 className="font-heading text-cream ">
                          {newMission.title}
                        </h4>
                        <p className=" text-fg-muted font-label uppercase">
                          {newMission.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-4">
                <p className="text-[10px] text-fg-muted uppercase tracking-widest mb-4">
                  Choose mission to remove
                </p>
                <div className="space-y-2">
                  {activeAchievementIds.map((activeId) => {
                    const activeMission = achievements.find(
                      (a) => a.id === activeId,
                    );
                    if (!activeMission) return null;

                    return (
                      <motion.button
                        key={activeId}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSwapConfirm(activeId)}
                        className="w-full p-4 border border-line bg-background hover:border-danger/50 hover:bg-danger-wash transition-all flex items-center gap-4 group text-left"
                      >
                        <div className="w-10 h-10 flex items-center justify-center border border-primary/50 text-primary group-hover:border-danger/50 group-hover:text-danger transition-colors">
                          <AchievementIcon
                            icon={activeMission.icon}
                            size={16}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading text-cream group-hover:text-danger transition-colors">
                            {activeMission.title}
                          </h4>
                          <p className=" text-fg-muted font-label uppercase">
                            {activeMission.progress || "In Progress"}
                          </p>
                        </div>
                        <div className=" text-fg-faint group-hover:text-danger font-label uppercase tracking-widest transition-colors">
                          Remove
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-line p-4">
                <Button
                  onClick={handleSwapCancel}
                  variant="outline"
                  className="w-full border-line text-fg-muted hover:text-cream hover:border-cream rounded-none h-10 text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
