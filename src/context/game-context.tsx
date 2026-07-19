"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  collectionSets as initialSets,
  achievements as initialAchievements,
  type CollectionSet,
  type Achievement,
  type CollectibleItem,
} from "@/lib/game-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { logger } from "@/lib/logger";
import type {
  Story,
  StoryReward,
  TrophyCustomization,
  UserBook,
  PillarProgress,
} from "@/lib/types";
import {
  calculateCollectorScore,
  calculateAchievementScore,
  calculateLevel,
  getLevelProgress,
  getCompletedSets,
  type UserAchievementProgress,
} from "@/lib/game-engine";
import {
  getCurrentCollectorMilestone,
  getNextCollectorMilestone,
  getCurrentAchievementMilestone,
  getNextAchievementMilestone,
  getCurrentMasteryMilestone,
  getNextMasteryMilestone,
  calculateLoadoutSlots,
  type MilestoneReward,
} from "@/lib/pillar-rewards";

// ============================================================================
// TYPES
// ============================================================================

// Timestamp data for collectibles (for entropy calculation)
export interface CollectibleTimestamps {
  unlockedAt?: string;
  lastPolishedAt?: string;
}

// Unified progress item for cross-referencing achievements, collectibles, and stories
export interface UnifiedProgressItem {
  type: "achievement" | "collectible" | "story";
  id: string;
  title: string;
  rarity?: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// Story progress state for the user
export interface StoryProgress {
  storyId: string;
  currentNodeId: string;
  completedNodes: string[];
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
  // Extended fields for pillar system
  xpEarned?: number;
  strikes?: number;
  gatesSkipped?: string[];
}

// ============================================================================
// CONTEXT TYPE
// ============================================================================

type GameContextType = {
  // === COLLECTIBLES PILLAR (Standalone) ===
  collectionSets: CollectionSet[];
  collectibleTimestamps: Record<string, CollectibleTimestamps>;
  collectorScore: number;
  collectorMilestone: MilestoneReward | null;
  nextCollectorMilestone: MilestoneReward | null;
  trophyCustomizations: Record<string, TrophyCustomization>;
  completedSetIds: string[];

  // === ACHIEVEMENTS PILLAR (Standalone) ===
  achievements: Achievement[];
  activeAchievementIds: string[];
  achievementScore: number;
  achievementMilestone: MilestoneReward | null;
  nextAchievementMilestone: MilestoneReward | null;
  loadoutSlots: number;

  // === STORIES PILLAR (Optional Deep Track) ===
  stories: Story[];
  storyProgress: Record<string, StoryProgress>;
  totalXP: number;
  currentLevel: number;
  levelProgress: {
    currentLevelXP: number;
    nextLevelXP: number;
    progressPercent: number;
  };

  // === BOOKS/MASTERY (Shared Infrastructure) ===
  userBooks: UserBook[];
  masteryCount: number;
  masteryMilestone: MilestoneReward | null;
  nextMasteryMilestone: MilestoneReward | null;

  // === UNIFIED STATE ===
  isLoading: boolean;
  unifiedProgress: UnifiedProgressItem[];
  pillarProgress: PillarProgress;

  // === COLLECTIBLES ACTIONS ===
  unlockItem: (setId: string, itemId: string) => void;
  polishCollectible: (collectibleId: string) => Promise<void>;
  findCollectible: (
    collectibleId: string,
  ) => { item: CollectibleItem; setId: string } | null;
  customizeTrophy: (
    collectibleId: string,
    skin: string,
    pedestal?: string,
  ) => Promise<void>;
  claimSetReward: (setId: string) => Promise<void>;

  // === ACHIEVEMENTS ACTIONS ===
  unlockAchievement: (achievementId: string) => void;
  toggleActiveAchievement: (achievementId: string) => void;
  swapActiveAchievement: (oldId: string, newId: string) => void;

  // === STORIES ACTIONS ===
  completeStory: (storyId: string) => Promise<void>;
  addXP: (
    amount: number,
    sourceType: string,
    sourceId?: string,
  ) => Promise<void>;

  // === GENERAL ACTIONS ===
  resetGameData: () => void;
  refreshData: () => Promise<void>;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // === COLLECTIBLES STATE ===
  const [collectionSets, setCollectionSets] =
    useState<CollectionSet[]>(initialSets);
  const [collectibleTimestamps, setCollectibleTimestamps] = useState<
    Record<string, CollectibleTimestamps>
  >({});
  const [trophyCustomizations, setTrophyCustomizations] = useState<
    Record<string, TrophyCustomization>
  >({});

  // === ACHIEVEMENTS STATE ===
  const [achievements, setAchievements] =
    useState<Achievement[]>(initialAchievements);
  const [activeAchievementIds, setActiveAchievementIds] = useState<string[]>(
    [],
  );

  // === STORIES STATE ===
  const [stories, setStories] = useState<Story[]>([]);
  const [storyProgress, setStoryProgress] = useState<
    Record<string, StoryProgress>
  >({});
  const [totalXP, setTotalXP] = useState(0);

  // === BOOKS/MASTERY STATE ===
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);

  // === GENERAL STATE ===
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Collector score and milestones
  const collectedItemIds = useMemo(() => {
    return collectionSets.flatMap((set) =>
      set.items
        .filter((item) => set.collected.includes(item.id))
        .map((item) => item.id),
    );
  }, [collectionSets]);

  const collectorScore = useMemo(
    () => calculateCollectorScore(collectedItemIds, collectionSets),
    [collectedItemIds, collectionSets],
  );

  const collectorMilestone = useMemo(
    () => getCurrentCollectorMilestone(collectedItemIds.length),
    [collectedItemIds.length],
  );

  const nextCollectorMilestone = useMemo(
    () => getNextCollectorMilestone(collectedItemIds.length),
    [collectedItemIds.length],
  );

  const completedSetIds = useMemo(
    () => getCompletedSets(collectedItemIds, collectionSets),
    [collectedItemIds, collectionSets],
  );

  // Achievement score and milestones
  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.unlocked),
    [achievements],
  );

  const achievementProgressData = useMemo(
    (): UserAchievementProgress[] =>
      achievements.map((a) => ({
        achievementId: a.id,
        currentValue: a.unlocked ? 1 : 0,
        isUnlocked: a.unlocked,
        tierReached: "bronze" as const, // Default tier, could be extended
      })),
    [achievements],
  );

  const achievementScore = useMemo(
    () => calculateAchievementScore(achievementProgressData),
    [achievementProgressData],
  );

  const achievementMilestone = useMemo(
    () => getCurrentAchievementMilestone(unlockedAchievements.length),
    [unlockedAchievements.length],
  );

  const nextAchievementMilestone = useMemo(
    () => getNextAchievementMilestone(unlockedAchievements.length),
    [unlockedAchievements.length],
  );

  const loadoutSlots = useMemo(
    () => calculateLoadoutSlots(completedSetIds),
    [completedSetIds],
  );

  // Level and XP progress
  const currentLevel = useMemo(() => calculateLevel(totalXP), [totalXP]);
  const levelProgress = useMemo(() => getLevelProgress(totalXP), [totalXP]);

  // Mastery
  const masteryCount = useMemo(
    () => userBooks.filter((b) => b.masteryComplete).length,
    [userBooks],
  );

  const masteryMilestone = useMemo(
    () => getCurrentMasteryMilestone(masteryCount),
    [masteryCount],
  );

  const nextMasteryMilestone = useMemo(
    () => getNextMasteryMilestone(masteryCount),
    [masteryCount],
  );

  // Unified pillar progress
  const pillarProgress = useMemo(
    (): PillarProgress => ({
      collectibles: {
        total: collectionSets.reduce((sum, set) => sum + set.total, 0),
        collected: collectedItemIds.length,
        score: collectorScore,
        completedSets: completedSetIds,
      },
      achievements: {
        total: achievements.length,
        unlocked: unlockedAchievements.length,
        score: achievementScore,
        equipped: activeAchievementIds,
      },
      stories: {
        total: stories.length,
        completed: Object.values(storyProgress).filter((p) => p.isCompleted)
          .length,
        inProgress: Object.values(storyProgress).filter((p) => !p.isCompleted)
          .length,
        totalXp: totalXP,
        level: currentLevel,
      },
      mastery: {
        totalBooks: userBooks.length,
        mastered: masteryCount,
        inProgress: userBooks.filter(
          (b) => !b.masteryComplete && b.milestonesCompleted > 0,
        ).length,
        score: masteryCount * 100,
      },
    }),
    [
      collectionSets,
      collectedItemIds,
      collectorScore,
      completedSetIds,
      achievements,
      unlockedAchievements,
      achievementScore,
      activeAchievementIds,
      stories,
      storyProgress,
      totalXP,
      currentLevel,
      userBooks,
      masteryCount,
    ],
  );

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      // Reset to defaults when logged out
      setCollectionSets(initialSets);
      setAchievements(initialAchievements);
      setActiveAchievementIds(initialAchievements.slice(0, 5).map((a) => a.id));
      setCollectibleTimestamps({});
      setTrophyCustomizations({});
      setStories([]);
      setStoryProgress({});
      setTotalXP(0);
      setUserBooks([]);
      return;
    }

    setIsLoading(true);
    try {
      // Parallel fetch all data
      const [
        achievementsResult,
        collectiblesResult,
        activeResult,
        storiesResult,
        storyProgressResult,
        profileResult,
        booksResult,
        customizationsResult,
      ] = await Promise.all([
        supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", user.id),
        supabase
          .from("user_collectibles")
          .select("collectible_id, collected_at, last_polished_at")
          .eq("user_id", user.id),
        supabase
          .from("user_active_achievements")
          .select("achievement_ids")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("stories").select("*").eq("is_published", true),
        supabase
          .from("user_story_progress")
          .select(
            "story_id, current_node_id, completed_nodes, is_completed, started_at, completed_at, xp_earned, strikes, gates_skipped",
          )
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("total_xp, collector_score, achievement_score")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_books")
          .select("*, product:products(*)")
          .eq("user_id", user.id),
        supabase
          .from("user_trophy_customizations")
          .select("*")
          .eq("user_id", user.id),
      ]);

      // Process achievements
      if (achievementsResult.error) {
        logger.error("Error fetching achievements:", achievementsResult.error);
      }
      const unlockedAchIds = new Set(
        achievementsResult.data?.map((a) => a.achievement_id) || [],
      );
      const mergedAchievements = initialAchievements.map((ach) => ({
        ...ach,
        unlocked: unlockedAchIds.has(ach.id) || ach.unlocked,
      }));
      setAchievements(mergedAchievements);

      // Process collectibles
      if (collectiblesResult.error) {
        logger.error("Error fetching collectibles:", collectiblesResult.error);
      }
      const unlockedItemIds = new Set(
        collectiblesResult.data?.map((c) => c.collectible_id) || [],
      );
      const mergedSets = initialSets.map((set) => {
        const localCollected = new Set(set.collected);
        set.items.forEach((item) => {
          if (unlockedItemIds.has(item.id)) {
            localCollected.add(item.id);
          }
        });
        return { ...set, collected: Array.from(localCollected) };
      });
      setCollectionSets(mergedSets);

      // Build timestamps
      const timestamps: Record<string, CollectibleTimestamps> = {};
      collectiblesResult.data?.forEach((c) => {
        timestamps[c.collectible_id] = {
          unlockedAt: c.collected_at,
          lastPolishedAt: c.last_polished_at,
        };
      });
      setCollectibleTimestamps(timestamps);

      // Process active achievements
      if (activeResult.error) {
        logger.error("Error fetching active achievements:", activeResult.error);
      }
      if (
        activeResult.data?.achievement_ids &&
        Array.isArray(activeResult.data.achievement_ids)
      ) {
        setActiveAchievementIds(activeResult.data.achievement_ids);
      } else {
        setActiveAchievementIds(
          initialAchievements.slice(0, 5).map((a) => a.id),
        );
      }

      // Process stories
      if (storiesResult.error) {
        logger.error("Error fetching stories:", storiesResult.error);
      } else if (storiesResult.data) {
        setStories(storiesResult.data as Story[]);
      }

      // Process story progress
      if (storyProgressResult.error) {
        logger.error(
          "Error fetching story progress:",
          storyProgressResult.error,
        );
      }
      const progressMap: Record<string, StoryProgress> = {};
      storyProgressResult.data?.forEach((p) => {
        progressMap[p.story_id] = {
          storyId: p.story_id,
          currentNodeId: p.current_node_id,
          completedNodes: p.completed_nodes || [],
          isCompleted: p.is_completed,
          startedAt: p.started_at,
          completedAt: p.completed_at,
          xpEarned: p.xp_earned || 0,
          strikes: p.strikes || 0,
          gatesSkipped: p.gates_skipped || [],
        };
      });
      setStoryProgress(progressMap);

      // Process profile XP
      if (profileResult.data?.total_xp) {
        setTotalXP(profileResult.data.total_xp);
      }

      // Process books
      if (booksResult.error) {
        logger.error("Error fetching books:", booksResult.error);
      }
      if (booksResult.data) {
        setUserBooks(
          booksResult.data.map((b) => ({
            id: b.id,
            userId: b.user_id,
            productId: b.product_id,
            acquiredAt: b.acquired_at,
            milestonesCompleted: b.milestones_completed || 0,
            masteryComplete: b.mastery_complete || false,
            completionPhotoUrl: b.completion_photo_url,
            isSacrificed: b.is_sacrificed || false,
            sacrificedForStoryId: b.sacrificed_for_story_id,
            product: b.product,
          })),
        );
      }

      // Process trophy customizations
      if (customizationsResult.error) {
        logger.error(
          "Error fetching customizations:",
          customizationsResult.error,
        );
      }
      const customs: Record<string, TrophyCustomization> = {};
      customizationsResult.data?.forEach((c) => {
        customs[c.collectible_id] = {
          collectibleId: c.collectible_id,
          skin: c.skin || "default",
          pedestal: c.pedestal || "default",
          updatedAt: c.updated_at,
        };
      });
      setTrophyCustomizations(customs);
    } catch (error) {
      logger.error("Error fetching game data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // ============================================================================
  // COLLECTIBLES ACTIONS
  // ============================================================================

  const findCollectible = useCallback(
    (
      collectibleId: string,
    ): { item: CollectibleItem; setId: string } | null => {
      for (const set of collectionSets) {
        const item = set.items.find((i) => i.id === collectibleId);
        if (item) {
          return { item, setId: set.id };
        }
      }
      return null;
    },
    [collectionSets],
  );

  const unlockItem = useCallback(
    async (setId: string, itemId: string) => {
      setCollectionSets((prev) => {
        const newSets = prev.map((set) => {
          if (set.id === setId && !set.collected.includes(itemId)) {
            return { ...set, collected: [...set.collected, itemId] };
          }
          return set;
        });
        return newSets;
      });

      const now = new Date().toISOString();
      setCollectibleTimestamps((prev) => ({
        ...prev,
        [itemId]: { unlockedAt: now, lastPolishedAt: undefined },
      }));

      if (user?.id) {
        try {
          await supabase.from("user_collectibles").upsert(
            {
              user_id: user.id,
              collectible_id: itemId,
              collected_at: now,
            },
            { onConflict: "user_id,collectible_id" },
          );
        } catch (err) {
          logger.error("Error saving collectible:", err);
        }
      }
    },
    [user?.id],
  );

  const polishCollectible = useCallback(
    async (collectibleId: string) => {
      if (!user?.id) return;

      const now = new Date().toISOString();
      setCollectibleTimestamps((prev) => ({
        ...prev,
        [collectibleId]: { ...prev[collectibleId], lastPolishedAt: now },
      }));

      try {
        await supabase
          .from("user_collectibles")
          .update({ last_polished_at: now })
          .eq("user_id", user.id)
          .eq("collectible_id", collectibleId);
      } catch (err) {
        logger.error("Error polishing collectible:", err);
      }
    },
    [user?.id],
  );

  const customizeTrophy = useCallback(
    async (collectibleId: string, skin: string, pedestal?: string) => {
      if (!user?.id) return;

      const now = new Date().toISOString();
      const newCustomization: TrophyCustomization = {
        collectibleId,
        skin,
        pedestal:
          pedestal ||
          trophyCustomizations[collectibleId]?.pedestal ||
          "default",
        updatedAt: now,
      };

      setTrophyCustomizations((prev) => ({
        ...prev,
        [collectibleId]: newCustomization,
      }));

      try {
        await supabase.from("user_trophy_customizations").upsert(
          {
            user_id: user.id,
            collectible_id: collectibleId,
            skin,
            pedestal: newCustomization.pedestal,
            updated_at: now,
          },
          { onConflict: "user_id,collectible_id" },
        );
      } catch (err) {
        logger.error("Error customizing trophy:", err);
      }
    },
    [user?.id, trophyCustomizations],
  );

  const claimSetReward = useCallback(
    async (setId: string) => {
      if (!user?.id) return;

      try {
        await supabase.from("user_set_completions").upsert(
          {
            user_id: user.id,
            set_id: setId,
            reward_claimed: true,
          },
          { onConflict: "user_id,set_id" },
        );
      } catch (err) {
        logger.error("Error claiming set reward:", err);
      }
    },
    [user?.id],
  );

  // ============================================================================
  // ACHIEVEMENTS ACTIONS
  // ============================================================================

  const unlockAchievement = useCallback(
    async (achievementId: string) => {
      setAchievements((prev) =>
        prev.map((a) =>
          a.id === achievementId ? { ...a, unlocked: true } : a,
        ),
      );

      if (user?.id) {
        try {
          await supabase.from("user_achievements").upsert(
            {
              user_id: user.id,
              achievement_id: achievementId,
            },
            { onConflict: "user_id,achievement_id" },
          );
        } catch (err) {
          logger.error("Error saving achievement:", err);
        }
      }

      // Cascading unlock: Check if this achievement grants a collectible
      const achievement = achievements.find((a) => a.id === achievementId);
      if (achievement?.grantsCollectibleId) {
        const collectible = findCollectible(achievement.grantsCollectibleId);
        if (collectible) {
          setTimeout(
            () => unlockItem(collectible.setId, collectible.item.id),
            100,
          );
        }
      }
    },
    [user?.id, achievements, findCollectible, unlockItem],
  );

  const toggleActiveAchievement = useCallback(
    async (achievementId: string) => {
      let newActiveIds: string[];

      setActiveAchievementIds((prev) => {
        if (prev.includes(achievementId)) {
          newActiveIds = prev.filter((id) => id !== achievementId);
        } else {
          if (prev.length >= loadoutSlots) {
            newActiveIds = prev;
            return prev;
          }
          newActiveIds = [...prev, achievementId];
        }
        return newActiveIds;
      });

      if (user?.id) {
        setTimeout(async () => {
          try {
            await supabase.from("user_active_achievements").upsert(
              {
                user_id: user.id,
                achievement_ids: newActiveIds!,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
          } catch (err) {
            logger.error("Error saving active achievements:", err);
          }
        }, 100);
      }
    },
    [user?.id, loadoutSlots],
  );

  const swapActiveAchievement = useCallback(
    async (oldId: string, newId: string) => {
      let newActiveIds: string[] = [];

      setActiveAchievementIds((prev) => {
        if (!prev.includes(oldId) || prev.includes(newId)) return prev;
        newActiveIds = prev.map((id) => (id === oldId ? newId : id));
        return newActiveIds;
      });

      if (user?.id) {
        setTimeout(async () => {
          try {
            await supabase.from("user_active_achievements").upsert(
              {
                user_id: user.id,
                achievement_ids: newActiveIds,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
          } catch (err) {
            logger.error("Error swapping active achievements:", err);
          }
        }, 100);
      }
    },
    [user?.id],
  );

  // ============================================================================
  // STORIES ACTIONS
  // ============================================================================

  const addXP = useCallback(
    async (amount: number, sourceType: string, sourceId?: string) => {
      if (!user?.id || amount <= 0) return;

      setTotalXP((prev) => prev + amount);

      try {
        // Log transaction
        await supabase.from("user_xp_transactions").insert({
          user_id: user.id,
          amount,
          source_type: sourceType,
          source_id: sourceId,
          raw_amount: amount,
        });

        // Update profile
        await supabase
          .from("profiles")
          .update({ total_xp: totalXP + amount })
          .eq("id", user.id);
      } catch (err) {
        logger.error("Error adding XP:", err);
      }
    },
    [user?.id, totalXP],
  );

  const completeStory = useCallback(
    async (storyId: string) => {
      if (!user?.id) return;

      const now = new Date().toISOString();

      setStoryProgress((prev) => ({
        ...prev,
        [storyId]: {
          ...prev[storyId],
          storyId,
          isCompleted: true,
          completedAt: now,
          startedAt: prev[storyId]?.startedAt || now,
          currentNodeId: prev[storyId]?.currentNodeId || "",
          completedNodes: prev[storyId]?.completedNodes || [],
        },
      }));

      try {
        await supabase.from("user_story_progress").upsert(
          {
            user_id: user.id,
            story_id: storyId,
            is_completed: true,
            completed_at: now,
          },
          { onConflict: "user_id,story_id" },
        );
      } catch (err) {
        logger.error("Error saving story completion:", err);
      }

      // Cascading rewards
      const story = stories.find((s) => s.id === storyId);
      if (story?.rewards) {
        story.rewards.forEach((reward: StoryReward) => {
          if (reward.type === "achievement" && reward.id) {
            unlockAchievement(reward.id);
          }
          if (reward.type === "product" && reward.id) {
            const collectible = findCollectible(reward.id);
            if (collectible) {
              unlockItem(collectible.setId, collectible.item.id);
            }
          }
        });
      }

      // Check collectibles granted by this story
      collectionSets.forEach((set) => {
        set.items.forEach((item) => {
          if (
            item.grantedByStoryId === storyId &&
            !set.collected.includes(item.id)
          ) {
            unlockItem(set.id, item.id);
          }
        });
      });
    },
    [
      user?.id,
      stories,
      collectionSets,
      unlockAchievement,
      unlockItem,
      findCollectible,
    ],
  );

  // ============================================================================
  // GENERAL ACTIONS
  // ============================================================================

  const resetGameData = useCallback(async () => {
    if (!user?.id) return;

    try {
      await Promise.all([
        supabase.from("user_achievements").delete().eq("user_id", user.id),
        supabase.from("user_collectibles").delete().eq("user_id", user.id),
        supabase
          .from("user_active_achievements")
          .delete()
          .eq("user_id", user.id),
        supabase.from("user_story_progress").delete().eq("user_id", user.id),
        supabase
          .from("user_trophy_customizations")
          .delete()
          .eq("user_id", user.id),
        supabase.from("user_set_completions").delete().eq("user_id", user.id),
        supabase.from("user_xp_transactions").delete().eq("user_id", user.id),
        supabase.from("user_books").delete().eq("user_id", user.id),
      ]);

      setCollectionSets(initialSets);
      setAchievements(initialAchievements);
      setActiveAchievementIds(initialAchievements.slice(0, 5).map((a) => a.id));
      setCollectibleTimestamps({});
      setTrophyCustomizations({});
      setTotalXP(0);
      setUserBooks([]);

      window.location.reload();
    } catch (error) {
      logger.error("Error resetting game data:", error);
    }
  }, [user?.id]);

  const refreshData = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  // ============================================================================
  // UNIFIED PROGRESS
  // ============================================================================

  const unifiedProgress = useMemo((): UnifiedProgressItem[] => {
    const items: UnifiedProgressItem[] = [];

    achievements
      .filter((a) => a.unlocked)
      .forEach((a) => {
        items.push({
          type: "achievement",
          id: a.id,
          title: a.title,
          rarity: a.rarity,
          unlocked: true,
          unlockedAt: a.date,
        });
      });

    collectionSets.forEach((set) => {
      set.items.forEach((item) => {
        if (set.collected.includes(item.id)) {
          items.push({
            type: "collectible",
            id: item.id,
            title: item.name,
            rarity: item.rarity,
            unlocked: true,
            unlockedAt: collectibleTimestamps[item.id]?.unlockedAt,
          });
        }
      });
    });

    stories.forEach((story) => {
      const progress = storyProgress[story.id];
      if (progress?.isCompleted) {
        items.push({
          type: "story",
          id: story.id,
          title: story.title,
          unlocked: true,
          unlockedAt: progress.completedAt,
        });
      }
    });

    return items.sort((a, b) => {
      if (!a.unlockedAt) return 1;
      if (!b.unlockedAt) return -1;
      return (
        new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
      );
    });
  }, [
    achievements,
    collectionSets,
    collectibleTimestamps,
    stories,
    storyProgress,
  ]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = useMemo(
    () => ({
      // Collectibles
      collectionSets,
      collectibleTimestamps,
      collectorScore,
      collectorMilestone,
      nextCollectorMilestone,
      trophyCustomizations,
      completedSetIds,
      // Achievements
      achievements,
      activeAchievementIds,
      achievementScore,
      achievementMilestone,
      nextAchievementMilestone,
      loadoutSlots,
      // Stories
      stories,
      storyProgress,
      totalXP,
      currentLevel,
      levelProgress,
      // Books/Mastery
      userBooks,
      masteryCount,
      masteryMilestone,
      nextMasteryMilestone,
      // Unified
      isLoading,
      unifiedProgress,
      pillarProgress,
      // Actions
      unlockItem,
      polishCollectible,
      findCollectible,
      customizeTrophy,
      claimSetReward,
      unlockAchievement,
      toggleActiveAchievement,
      swapActiveAchievement,
      completeStory,
      addXP,
      resetGameData,
      refreshData,
    }),
    [
      collectionSets,
      collectibleTimestamps,
      collectorScore,
      collectorMilestone,
      nextCollectorMilestone,
      trophyCustomizations,
      completedSetIds,
      achievements,
      activeAchievementIds,
      achievementScore,
      achievementMilestone,
      nextAchievementMilestone,
      loadoutSlots,
      stories,
      storyProgress,
      totalXP,
      currentLevel,
      levelProgress,
      userBooks,
      masteryCount,
      masteryMilestone,
      nextMasteryMilestone,
      isLoading,
      unifiedProgress,
      pillarProgress,
      unlockItem,
      polishCollectible,
      findCollectible,
      customizeTrophy,
      claimSetReward,
      unlockAchievement,
      toggleActiveAchievement,
      swapActiveAchievement,
      completeStory,
      addXP,
      resetGameData,
      refreshData,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

/**
 * Hook for components that only care about collectibles.
 * Provides standalone collectibles pillar experience.
 */
export function useCollectibles() {
  const {
    collectionSets,
    collectibleTimestamps,
    collectorScore,
    collectorMilestone,
    nextCollectorMilestone,
    trophyCustomizations,
    completedSetIds,
    unlockItem,
    polishCollectible,
    findCollectible,
    customizeTrophy,
    claimSetReward,
    isLoading,
  } = useGame();

  const allCollectibles = useMemo(
    () =>
      collectionSets.flatMap((set) =>
        set.items.map((item) => ({
          ...item,
          setId: set.id,
          setTitle: set.title,
          isCollected: set.collected.includes(item.id),
          timestamps: collectibleTimestamps[item.id],
          customization: trophyCustomizations[item.id],
        })),
      ),
    [collectionSets, collectibleTimestamps, trophyCustomizations],
  );

  return {
    collectionSets,
    allCollectibles,
    collectorScore,
    collectorMilestone,
    nextCollectorMilestone,
    trophyCustomizations,
    completedSetIds,
    unlockItem,
    polishCollectible,
    findCollectible,
    customizeTrophy,
    claimSetReward,
    isLoading,
  };
}

/**
 * Hook for components that only care about achievements.
 * Provides standalone achievements pillar experience.
 */
export function useAchievements() {
  const {
    achievements,
    activeAchievementIds,
    achievementScore,
    achievementMilestone,
    nextAchievementMilestone,
    loadoutSlots,
    unlockAchievement,
    toggleActiveAchievement,
    swapActiveAchievement,
    isLoading,
  } = useGame();

  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.unlocked),
    [achievements],
  );

  const lockedAchievements = useMemo(
    () => achievements.filter((a) => !a.unlocked),
    [achievements],
  );

  return {
    achievements,
    unlockedAchievements,
    lockedAchievements,
    activeAchievementIds,
    achievementScore,
    achievementMilestone,
    nextAchievementMilestone,
    loadoutSlots,
    unlockAchievement,
    toggleActiveAchievement,
    swapActiveAchievement,
    isLoading,
  };
}

/**
 * Hook for components that care about stories and XP.
 * Provides the deep story track experience.
 */
export function useStories() {
  const {
    stories,
    storyProgress,
    totalXP,
    currentLevel,
    levelProgress,
    completeStory,
    addXP,
    activeAchievementIds,
    completedSetIds,
    isLoading,
  } = useGame();

  const completedStories = useMemo(
    () => stories.filter((s) => storyProgress[s.id]?.isCompleted),
    [stories, storyProgress],
  );

  const inProgressStories = useMemo(
    () =>
      stories.filter(
        (s) => storyProgress[s.id] && !storyProgress[s.id].isCompleted,
      ),
    [stories, storyProgress],
  );

  const lockedStories = useMemo(
    () => stories.filter((s) => !storyProgress[s.id]),
    [stories, storyProgress],
  );

  return {
    stories,
    storyProgress,
    completedStories,
    inProgressStories,
    lockedStories,
    totalXP,
    currentLevel,
    levelProgress,
    completeStory,
    addXP,
    // Cross-pillar bonuses available
    activeAchievementIds,
    completedSetIds,
    isLoading,
  };
}

/**
 * Hook for unified progress across all pillars.
 * Useful for dashboards and profile displays.
 */
export function useUnifiedProgress() {
  const {
    unifiedProgress,
    pillarProgress,
    collectorMilestone,
    achievementMilestone,
    masteryMilestone,
    currentLevel,
    totalXP,
  } = useGame();

  const recentUnlocks = useMemo(
    () => unifiedProgress.slice(0, 10),
    [unifiedProgress],
  );

  return {
    unifiedProgress,
    recentUnlocks,
    pillarProgress,
    milestones: {
      collector: collectorMilestone,
      achievement: achievementMilestone,
      mastery: masteryMilestone,
    },
    level: currentLevel,
    totalXP,
  };
}
