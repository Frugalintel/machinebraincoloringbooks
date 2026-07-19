"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Trophy,
  Star,
  BookOpen,
  Sparkles,
  ArrowRight,
  Lock,
  Zap,
  Target,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  useUnifiedProgress,
  useCollectibles,
  useAchievements,
  useStories,
} from "@/context/game-context";
import {
  PillarProgressBar,
  PillarStatsGrid,
} from "@/components/game/PillarScore";
import { MilestonePreview, RewardBadge } from "@/components/game/RewardBadge";
import {
  InvitationCard,
  CrossPillarBonusPreview,
} from "@/components/game/InvitationCard";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import {
  ACHIEVEMENT_CATEGORY_BONUSES,
  calculatePenaltyReduction,
} from "@/lib/pillar-rewards";

const TrophyCanvas = dynamic(
  () => import("@/components/three").then((m) => m.TrophyCanvas),
  { ssr: false },
);

export default function GameDashboardPage() {
  const { user, openAuthModal } = useAuth();
  const { pillarProgress, recentUnlocks, milestones, level, totalXP } =
    useUnifiedProgress();
  const { collectorScore, nextCollectorMilestone, completedSetIds } =
    useCollectibles();
  const {
    achievements,
    activeAchievementIds,
    achievementScore,
    nextAchievementMilestone,
    loadoutSlots,
  } = useAchievements();
  const { stories, completedStories, inProgressStories, levelProgress } =
    useStories();

  // Calculate active cross-pillar bonuses
  const activeBonuses: Array<{
    source: "collectibles" | "achievements" | "stories" | "mastery";
    label: string;
    value: string;
  }> = [];

  Object.entries(ACHIEVEMENT_CATEGORY_BONUSES).forEach(([category, config]) => {
    const matchCount = activeAchievementIds.filter((id) =>
      config.achievementIds.includes(id),
    ).length;
    if (matchCount > 0) {
      activeBonuses.push({
        source: "achievements",
        label: `${category} Stories`,
        value: `+${Math.round(matchCount * config.bonus * 100)}% XP`,
      });
    }
  });

  const penaltyReduction = calculatePenaltyReduction(completedSetIds);
  if (penaltyReduction > 0) {
    activeBonuses.push({
      source: "collectibles",
      label: "Penalty Reduction",
      value: `-${Math.round(penaltyReduction * 100)}%`,
    });
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white font-sans flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-8 bg-[#111] border border-[#333] rounded-full flex items-center justify-center relative">
              <Lock size={40} className="text-gray-600" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full animate-pulse flex items-center justify-center">
                <Sparkles size={16} className="text-black" />
              </div>
            </div>
            <h1 className="font-heading text-4xl text-white uppercase mb-4">
              Game Hub
            </h1>
            <p className="text-gray-400 font-mono text-sm mb-8 leading-relaxed">
              Track your progress across all pillars: Collectibles,
              Achievements, Stories, and Mastery. Each pillar works standalone
              with optional cross-pillar bonuses.
            </p>
            <Button
              onClick={() => openAuthModal("register")}
              className="bg-primary text-black hover:bg-white font-heading uppercase tracking-widest px-8 py-6 text-lg rounded-none"
            >
              Start Your Journey
            </Button>

            {/* Preview pillars */}
            <div className="mt-12 grid grid-cols-2 gap-4 text-left">
              {[
                {
                  icon: Trophy,
                  label: "Collectibles",
                  desc: "3D Trophies & Sets",
                },
                {
                  icon: Star,
                  label: "Achievements",
                  desc: "Badges & Loadouts",
                },
                { icon: Sparkles, label: "Stories", desc: "XP & Narrative" },
                { icon: BookOpen, label: "Mastery", desc: "Book Completion" },
              ].map((pillar, i) => (
                <div key={i} className="bg-[#111] border border-[#222] p-4">
                  <pillar.icon size={20} className="text-primary mb-2" />
                  <h3 className="font-heading text-white uppercase text-sm">
                    {pillar.label}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <div className="bg-[#111] border-b border-[#333] py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4 text-primary font-mono uppercase tracking-widest text-xs">
                <Grid3X3 size={14} />
                <span>Unified Progress Hub</span>
              </div>
              <h1 className="font-heading text-5xl md:text-7xl font-bold text-white mb-4 uppercase tracking-tighter">
                Game Dashboard
              </h1>
              <p className="font-mono text-sm text-gray-500 tracking-widest uppercase max-w-xl">
                All pillars at a glance. Each works standalone with optional
                cross-pillar bonuses.
              </p>
            </div>

            {/* Level & XP Summary */}
            <div className="flex gap-4">
              <div className="bg-black border border-[#333] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-primary" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                    Level
                  </span>
                </div>
                <p className="font-heading text-3xl text-primary">{level}</p>
              </div>
              <div className="bg-black border border-[#333] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-gray-500" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                    Total XP
                  </span>
                </div>
                <p className="font-heading text-3xl text-white">
                  {totalXP.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-6">
            <PillarProgressBar
              pillar="story"
              current={levelProgress.currentLevelXP}
              max={levelProgress.nextLevelXP}
              label={`Level ${level} Progress`}
              showValues={true}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        {/* Cross-Pillar Bonuses */}
        {activeBonuses.length > 0 && (
          <div className="mb-12">
            <CrossPillarBonusPreview bonuses={activeBonuses} />
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl text-white uppercase mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-primary" /> Pillar Overview
          </h2>
          <PillarStatsGrid
            stats={[
              {
                pillar: "collector",
                score: collectorScore,
                label: "Collector",
              },
              {
                pillar: "achievement",
                score: achievementScore,
                label: "Achiever",
              },
              { pillar: "story", score: totalXP, label: "Story XP" },
              {
                pillar: "mastery",
                score: pillarProgress.mastery.score,
                label: "Mastery",
              },
            ]}
            columns={4}
            size="md"
          />
        </div>

        {/* Pillar Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Collectibles Pillar */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy size={20} className="text-amber-500" />
                <h3 className="font-heading text-xl text-white uppercase">
                  Collectibles
                </h3>
              </div>
              <Link href="/trophy-room">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-500 hover:text-white text-[10px] uppercase tracking-widest"
                >
                  View All <ArrowRight size={12} className="ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <PillarProgressBar
                pillar="collector"
                current={pillarProgress.collectibles.collected}
                max={pillarProgress.collectibles.total}
                label="Collection"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#222] p-3 text-center">
                  <p className="font-heading text-2xl text-amber-500">
                    {pillarProgress.collectibles.completedSets.length}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">
                    Sets Complete
                  </p>
                </div>
                <div className="bg-[#111] border border-[#222] p-3 text-center">
                  <p className="font-heading text-2xl text-white">
                    {collectorScore}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">
                    Score
                  </p>
                </div>
              </div>

              {nextCollectorMilestone ? (
                <MilestonePreview
                  current={pillarProgress.collectibles.collected}
                  next={{
                    threshold: nextCollectorMilestone.threshold,
                    reward: nextCollectorMilestone.reward,
                  }}
                  pillarLabel="Collector"
                />
              ) : null}
            </div>
          </div>

          {/* Achievements Pillar */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Star size={20} className="text-purple-500" />
                <h3 className="font-heading text-xl text-white uppercase">
                  Achievements
                </h3>
              </div>
              <Link href="/achievements">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-500 hover:text-white text-[10px] uppercase tracking-widest"
                >
                  View All <ArrowRight size={12} className="ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <PillarProgressBar
                pillar="achievement"
                current={pillarProgress.achievements.unlocked}
                max={pillarProgress.achievements.total}
                label="Unlocked"
              />

              {/* Active Loadout Preview */}
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2 block">
                  Active Loadout ({activeAchievementIds.length}/{loadoutSlots})
                </span>
                <div className="flex gap-2">
                  {Array.from({ length: loadoutSlots }).map((_, i) => {
                    const achId = activeAchievementIds[i];
                    const ach = achievements.find((a) => a.id === achId);
                    return (
                      <div
                        key={i}
                        className={`w-10 h-10 border flex items-center justify-center ${ach ? "border-purple-500/50 bg-[#111]" : "border-[#222] border-dashed"}`}
                      >
                        {ach ? (
                          <AchievementIcon
                            icon={ach.icon}
                            size={16}
                            className="text-purple-500"
                          />
                        ) : (
                          <span className="text-[8px] text-gray-700">+</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {nextAchievementMilestone ? (
                <MilestonePreview
                  current={pillarProgress.achievements.unlocked}
                  next={{
                    threshold: nextAchievementMilestone.threshold,
                    reward: nextAchievementMilestone.reward,
                  }}
                  pillarLabel="Achievement"
                />
              ) : null}
            </div>
          </div>

          {/* Stories Pillar */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-primary" />
                <h3 className="font-heading text-xl text-white uppercase">
                  Stories
                </h3>
              </div>
              <Link href="/stories">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-white text-[10px] uppercase tracking-widest"
                >
                  View All <ArrowRight size={12} className="ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#111] border border-[#222] p-3 text-center">
                  <p className="font-heading text-2xl text-green-500">
                    {completedStories.length}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">
                    Complete
                  </p>
                </div>
                <div className="bg-[#111] border border-[#222] p-3 text-center">
                  <p className="font-heading text-2xl text-amber-500">
                    {inProgressStories.length}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">
                    In Progress
                  </p>
                </div>
                <div className="bg-[#111] border border-[#222] p-3 text-center">
                  <p className="font-heading text-2xl text-gray-600">
                    {stories.length -
                      completedStories.length -
                      inProgressStories.length}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">
                    Locked
                  </p>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">
                    Total XP Earned
                  </span>
                  <span className="font-heading text-xl text-primary">
                    {totalXP.toLocaleString()}
                  </span>
                </div>
              </div>

              {activeBonuses.length === 0 && (
                <InvitationCard
                  type="achievements"
                  title="Boost Your XP"
                  standaloneReward="Stories work standalone!"
                  crossPillarInvitation="Equip themed achievements for bonus XP in matching categories."
                  ctaText="View Achievements"
                  ctaLink="/achievements"
                  variant="compact"
                />
              )}
            </div>
          </div>

          {/* Mastery Pillar */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-emerald-500" />
                <h3 className="font-heading text-xl text-white uppercase">
                  Mastery
                </h3>
              </div>
              <Link href="/store">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-500 hover:text-white text-[10px] uppercase tracking-widest"
                >
                  Browse Books <ArrowRight size={12} className="ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#222] p-3 text-center">
                  <p className="font-heading text-2xl text-emerald-500">
                    {pillarProgress.mastery.mastered}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">
                    Mastered
                  </p>
                </div>
                <div className="bg-[#111] border border-[#222] p-3 text-center">
                  <p className="font-heading text-2xl text-white">
                    {pillarProgress.mastery.inProgress}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">
                    In Progress
                  </p>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] p-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Master books by completing all 10 milestones. Earn standalone
                  badges and optional XP for story mode.
                </p>
              </div>

              {milestones.mastery ? (
                <RewardBadge
                  type={milestones.mastery.reward.type}
                  value={milestones.mastery.reward.value}
                  label={milestones.mastery.reward.label}
                  earned={true}
                  size="sm"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentUnlocks.length > 0 && (
          <div className="mb-12">
            <h2 className="font-heading text-2xl text-white uppercase mb-6 flex items-center gap-2">
              <Sparkles size={20} className="text-primary" /> Recent Activity
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recentUnlocks.slice(0, 5).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#0a0a0a] border border-[#222] p-4 text-center"
                >
                  <div
                    className={`w-10 h-10 mx-auto mb-2 flex items-center justify-center border ${
                      item.type === "achievement"
                        ? "border-purple-500/50 text-purple-500"
                        : item.type === "collectible"
                          ? "border-amber-500/50 text-amber-500"
                          : "border-primary/50 text-primary"
                    }`}
                  >
                    {item.type === "achievement" ? (
                      <Star size={16} />
                    ) : item.type === "collectible" ? (
                      <Trophy size={16} />
                    ) : (
                      <Sparkles size={16} />
                    )}
                  </div>
                  <p className="text-xs text-white font-heading uppercase truncate">
                    {item.title}
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono uppercase">
                    {item.type}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 3D Trophy Preview */}
        <div className="bg-[#0a0a0a] border border-[#222] p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-square max-w-[300px] mx-auto bg-[#111] border border-[#333] overflow-hidden">
              <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-10" />
              <TrophyCanvas
                size="large"
                rarity={
                  level >= 15
                    ? "Legendary"
                    : level >= 10
                      ? "Epic"
                      : level >= 5
                        ? "Rare"
                        : "Common"
                }
                autoRotate={true}
                isInteractive={true}
              />
              <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] font-mono text-gray-500 uppercase pointer-events-none z-20">
                Drag to Rotate
              </div>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-white uppercase mb-4">
                Your Progress Trophy
              </h3>
              <p className="text-gray-400 mb-6">
                This trophy represents your overall progress across all pillars.
                It evolves as you level up and complete milestones.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Trophy Tier:</span>
                  <span
                    className={`font-heading uppercase ${
                      level >= 15
                        ? "text-orange-400"
                        : level >= 10
                          ? "text-purple-400"
                          : level >= 5
                            ? "text-blue-400"
                            : "text-gray-400"
                    }`}
                  >
                    {level >= 15
                      ? "Legendary"
                      : level >= 10
                        ? "Epic"
                        : level >= 5
                          ? "Rare"
                          : "Common"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Current Level:</span>
                  <span className="text-primary font-heading">{level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Progress:</span>
                  <span className="text-white font-mono">
                    {pillarProgress.collectibles.collected +
                      pillarProgress.achievements.unlocked +
                      completedStories.length +
                      pillarProgress.mastery.mastered}{" "}
                    items
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
