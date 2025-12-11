"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { collectionSets as initialSets, achievements as initialAchievements, type CollectionSet, type Achievement, type CollectibleItem } from "@/lib/game-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { logger } from "@/lib/logger";
import type { Story, StoryReward } from "@/lib/types";

// Timestamp data for collectibles (for entropy calculation)
export interface CollectibleTimestamps {
  unlockedAt?: string;
  lastPolishedAt?: string;
}

// Unified progress item for cross-referencing achievements, collectibles, and stories
export interface UnifiedProgressItem {
  type: 'achievement' | 'collectible' | 'story';
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
}

type GameContextType = {
  collectionSets: CollectionSet[];
  achievements: Achievement[];
  activeAchievementIds: string[];
  isLoading: boolean;
  // Collectible timestamps for entropy
  collectibleTimestamps: Record<string, CollectibleTimestamps>;
  // Stories state
  stories: Story[];
  storyProgress: Record<string, StoryProgress>;
  // Unified progress across all game systems
  unifiedProgress: UnifiedProgressItem[];
  unlockItem: (setId: string, itemId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  toggleActiveAchievement: (achievementId: string) => void;
  swapActiveAchievement: (oldId: string, newId: string) => void;
  resetGameData: () => void;
  refreshData: () => Promise<void>;
  // Polish collectible to reset entropy
  polishCollectible: (collectibleId: string) => Promise<void>;
  // Story completion with cascading rewards
  completeStory: (storyId: string) => Promise<void>;
  // Find collectible by ID (across all sets)
  findCollectible: (collectibleId: string) => { item: CollectibleItem; setId: string } | null;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [collectionSets, setCollectionSets] = useState<CollectionSet[]>(initialSets);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [activeAchievementIds, setActiveAchievementIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Store timestamps for each collectible (keyed by collectible_id)
  const [collectibleTimestamps, setCollectibleTimestamps] = useState<Record<string, CollectibleTimestamps>>({});
  // Stories data from database
  const [stories, setStories] = useState<Story[]>([]);
  // Story progress for current user (keyed by story_id)
  const [storyProgress, setStoryProgress] = useState<Record<string, StoryProgress>>({});

  // Fetch user data from database
  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      // Reset to defaults when logged out
      setCollectionSets(initialSets);
      setAchievements(initialAchievements);
      setActiveAchievementIds(initialAchievements.slice(0, 5).map(a => a.id));
      setCollectibleTimestamps({});
      setStories([]);
      setStoryProgress({});
      return;
    }

    setIsLoading(true);
    try {
      // Fetch unlocked achievements
      const { data: unlockedAchievements, error: achError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (achError) {
        logger.error('Error fetching achievements:', achError);
      }

      // Fetch unlocked collectibles WITH timestamps for entropy
      const { data: unlockedCollectibles, error: collError } = await supabase
        .from('user_collectibles')
        .select('collectible_id, collected_at, last_polished_at')
        .eq('user_id', user.id);

      if (collError) {
        logger.error('Error fetching collectibles:', collError);
      }

      // Fetch active achievement loadout
      const { data: activeData, error: activeError } = await supabase
        .from('user_active_achievements')
        .select('achievement_ids')
        .eq('user_id', user.id)
        .maybeSingle();

      if (activeError) {
        logger.error('Error fetching active achievements:', activeError);
      }

      // Fetch all stories (published)
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('is_published', true);

      if (storiesError) {
        logger.error('Error fetching stories:', storiesError);
      } else if (storiesData) {
        setStories(storiesData as Story[]);
      }

      // Fetch user story progress
      const { data: storyProgressData, error: storyProgressError } = await supabase
        .from('user_story_progress')
        .select('story_id, current_node_id, completed_nodes, is_completed, started_at, completed_at')
        .eq('user_id', user.id);

      if (storyProgressError) {
        logger.error('Error fetching story progress:', storyProgressError);
      }

      // Build story progress map
      const progressMap: Record<string, StoryProgress> = {};
      storyProgressData?.forEach(p => {
        progressMap[p.story_id] = {
          storyId: p.story_id,
          currentNodeId: p.current_node_id,
          completedNodes: p.completed_nodes || [],
          isCompleted: p.is_completed,
          startedAt: p.started_at,
          completedAt: p.completed_at,
        };
      });
      setStoryProgress(progressMap);

      // Merge unlocked achievements with initial data
      const unlockedAchIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);
      const mergedAchievements = initialAchievements.map(ach => ({
        ...ach,
        unlocked: unlockedAchIds.has(ach.id) || ach.unlocked,
      }));
      setAchievements(mergedAchievements);

      // Merge unlocked collectibles with initial data
      const unlockedItemIds = new Set(unlockedCollectibles?.map(c => c.collectible_id) || []);
      
      const mergedSets = initialSets.map(set => {
        // Get locally "collected" from initial data
        const localCollected = new Set(set.collected);
        // Add database collected items that belong to this set
        set.items.forEach(item => {
            if (unlockedItemIds.has(item.id)) {
                localCollected.add(item.id);
            }
        });
        return {
            ...set,
            collected: Array.from(localCollected)
        };
      });
      setCollectionSets(mergedSets);

      // Build timestamps map for entropy calculation
      const timestamps: Record<string, CollectibleTimestamps> = {};
      unlockedCollectibles?.forEach(c => {
        timestamps[c.collectible_id] = {
          unlockedAt: c.collected_at,
          lastPolishedAt: c.last_polished_at,
        };
      });
      setCollectibleTimestamps(timestamps);

      // Set active achievements
      if (activeData?.achievement_ids && Array.isArray(activeData.achievement_ids)) {
        setActiveAchievementIds(activeData.achievement_ids);
      } else {
        setActiveAchievementIds(initialAchievements.slice(0, 5).map(a => a.id));
      }

    } catch (error) {
      logger.error('Error fetching game data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch data when user changes
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const unlockItem = useCallback(async (setId: string, itemId: string) => {
    // Update local state immediately
    setCollectionSets((prev) => {
      const newSets = prev.map((set) => {
        if (set.id === setId) {
          if (!set.collected.includes(itemId)) {
            return { ...set, collected: [...set.collected, itemId] };
          }
        }
        return set;
      });
      return newSets;
    });

    // Also update timestamps with current time
    const now = new Date().toISOString();
    setCollectibleTimestamps(prev => ({
      ...prev,
      [itemId]: {
        unlockedAt: now,
        lastPolishedAt: undefined,
      }
    }));

    // Save to database if logged in
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_collectibles')
          .upsert({
            user_id: user.id,
            collectible_id: itemId,
            collected_at: now,
          }, {
            onConflict: 'user_id,collectible_id'
          });

        if (error) {
          logger.error('Error saving collectible:', error);
        }
      } catch (err) {
        logger.error('Error saving collectible:', err);
      }
    }
  }, [user?.id]);

  // Polish a collectible to reset its entropy
  const polishCollectible = useCallback(async (collectibleId: string) => {
    if (!user?.id) {
      logger.warn('Cannot polish collectible: user not logged in');
      return;
    }

    const now = new Date().toISOString();

    // Update local state immediately
    setCollectibleTimestamps(prev => ({
      ...prev,
      [collectibleId]: {
        ...prev[collectibleId],
        lastPolishedAt: now,
      }
    }));

    // Save to database
    try {
      const { error } = await supabase
        .from('user_collectibles')
        .update({ last_polished_at: now })
        .eq('user_id', user.id)
        .eq('collectible_id', collectibleId);

      if (error) {
        logger.error('Error polishing collectible:', error);
      }
    } catch (err) {
      logger.error('Error polishing collectible:', err);
    }
  }, [user?.id]);

  // Helper to find a collectible by ID across all sets
  const findCollectible = useCallback((collectibleId: string): { item: CollectibleItem; setId: string } | null => {
    for (const set of collectionSets) {
      const item = set.items.find(i => i.id === collectibleId);
      if (item) {
        return { item, setId: set.id };
      }
    }
    return null;
  }, [collectionSets]);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    // Update local state immediately
    setAchievements(prev => prev.map(a => 
      a.id === achievementId ? { ...a, unlocked: true } : a
    ));

    // Save to database if logged in
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_achievements')
          .upsert({
            user_id: user.id,
            achievement_id: achievementId,
          }, {
            onConflict: 'user_id,achievement_id'
          });

        if (error) {
          logger.error('Error saving achievement:', error);
        }
      } catch (err) {
        logger.error('Error saving achievement:', err);
      }
    }

    // Cascading unlock: Check if this achievement grants a collectible
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement?.grantsCollectibleId) {
      const collectible = findCollectible(achievement.grantsCollectibleId);
      if (collectible) {
        // Delay slightly to ensure achievement is saved first
        setTimeout(() => {
          unlockItem(collectible.setId, collectible.item.id);
        }, 100);
      }
    }
  }, [user?.id, achievements, findCollectible]);

  const toggleActiveAchievement = useCallback(async (achievementId: string) => {
    let newActiveIds: string[];
    
    setActiveAchievementIds(prev => {
      if (prev.includes(achievementId)) {
        newActiveIds = prev.filter(id => id !== achievementId);
      } else {
        if (prev.length >= 5) {
          newActiveIds = prev;
          return prev;
        }
        newActiveIds = [...prev, achievementId];
      }
      return newActiveIds;
    });

    // Save to database if logged in
    if (user?.id) {
      // Small delay to ensure state is updated
      setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('user_active_achievements')
            .upsert({
              user_id: user.id,
              achievement_ids: newActiveIds!,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

            if (error) {
              logger.error('Error saving active achievements:', error);
            }
          } catch (err) {
            logger.error('Error saving active achievements:', err);
          }
      }, 100);
    }
  }, [user?.id]);

  const swapActiveAchievement = useCallback(async (oldId: string, newId: string) => {
    let newActiveIds: string[] = [];

    setActiveAchievementIds(prev => {
      if (!prev.includes(oldId)) return prev;
      if (prev.includes(newId)) return prev;

      newActiveIds = prev.map(id => id === oldId ? newId : id);
      return newActiveIds;
    });

    // Save to database if logged in
    if (user?.id) {
        setTimeout(async () => {
          try {
            const { error } = await supabase
              .from('user_active_achievements')
              .upsert({
                user_id: user.id,
                achievement_ids: newActiveIds,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id'
              });
  
            if (error) {
              logger.error('Error swapping active achievements:', error);
            }
          } catch (err) {
            logger.error('Error swapping active achievements:', err);
          }
        }, 100);
    }
  }, [user?.id]);

  const resetGameData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Delete all user game data from database
      await Promise.all([
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('user_collectibles').delete().eq('user_id', user.id),
        supabase.from('user_active_achievements').delete().eq('user_id', user.id),
        supabase.from('user_story_progress').delete().eq('user_id', user.id),
      ]);

      // Reset local state
      setCollectionSets(initialSets);
      setAchievements(initialAchievements);
      setActiveAchievementIds(initialAchievements.slice(0, 5).map(a => a.id));
      setCollectibleTimestamps({});
      
      window.location.reload();
    } catch (error) {
      logger.error('Error resetting game data:', error);
    }
  }, [user?.id]);

  const refreshData = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  // Complete a story and trigger cascading rewards
  const completeStory = useCallback(async (storyId: string) => {
    if (!user?.id) {
      logger.warn('Cannot complete story: user not logged in');
      return;
    }

    const now = new Date().toISOString();

    // Update local state immediately
    setStoryProgress(prev => ({
      ...prev,
      [storyId]: {
        ...prev[storyId],
        storyId,
        isCompleted: true,
        completedAt: now,
        startedAt: prev[storyId]?.startedAt || now,
        currentNodeId: prev[storyId]?.currentNodeId || '',
        completedNodes: prev[storyId]?.completedNodes || [],
      }
    }));

    // Save to database
    try {
      const { error } = await supabase
        .from('user_story_progress')
        .upsert({
          user_id: user.id,
          story_id: storyId,
          is_completed: true,
          completed_at: now,
        }, {
          onConflict: 'user_id,story_id'
        });

      if (error) {
        logger.error('Error saving story completion:', error);
      }
    } catch (err) {
      logger.error('Error saving story completion:', err);
    }

    // Cascading rewards: Check story rewards and trigger unlocks
    const story = stories.find(s => s.id === storyId);
    if (story?.rewards) {
      story.rewards.forEach((reward: StoryReward) => {
        if (reward.type === 'achievement' && reward.id) {
          unlockAchievement(reward.id);
        }
        // Note: For collectible rewards, we need the setId. 
        // The reward.id should match a collectible ID
        if (reward.type === 'product' && reward.id) {
          // 'product' type might be used for collectibles in story rewards
          const collectible = findCollectible(reward.id);
          if (collectible) {
            unlockItem(collectible.setId, collectible.item.id);
          }
        }
      });
    }

    // Also check if any collectibles are granted by this story
    collectionSets.forEach(set => {
      set.items.forEach(item => {
        if (item.grantedByStoryId === storyId && !set.collected.includes(item.id)) {
          unlockItem(set.id, item.id);
        }
      });
    });
  }, [user?.id, stories, collectionSets, unlockAchievement, unlockItem, findCollectible]);

  // Unified progress across achievements, collectibles, and stories
  const unifiedProgress = useMemo((): UnifiedProgressItem[] => {
    const items: UnifiedProgressItem[] = [];

    // Add unlocked achievements
    achievements.filter(a => a.unlocked).forEach(a => {
      items.push({
        type: 'achievement',
        id: a.id,
        title: a.title,
        rarity: a.rarity,
        unlocked: true,
        unlockedAt: a.date,
      });
    });

    // Add collected items
    collectionSets.forEach(set => {
      set.items.forEach(item => {
        if (set.collected.includes(item.id)) {
          items.push({
            type: 'collectible',
            id: item.id,
            title: item.name,
            rarity: item.rarity,
            unlocked: true,
            unlockedAt: collectibleTimestamps[item.id]?.unlockedAt,
          });
        }
      });
    });

    // Add completed stories
    stories.forEach(story => {
      const progress = storyProgress[story.id];
      if (progress?.isCompleted) {
        items.push({
          type: 'story',
          id: story.id,
          title: story.title,
          unlocked: true,
          unlockedAt: progress.completedAt,
        });
      }
    });

    // Sort by unlock date (most recent first)
    return items.sort((a, b) => {
      if (!a.unlockedAt) return 1;
      if (!b.unlockedAt) return -1;
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    });
  }, [achievements, collectionSets, collectibleTimestamps, stories, storyProgress]);

  const value = useMemo(() => ({
    collectionSets,
    achievements,
    activeAchievementIds,
    isLoading,
    collectibleTimestamps,
    stories,
    storyProgress,
    unifiedProgress,
    unlockItem,
    unlockAchievement,
    toggleActiveAchievement,
    swapActiveAchievement,
    resetGameData,
    refreshData,
    polishCollectible,
    completeStory,
    findCollectible,
  }), [collectionSets, achievements, activeAchievementIds, isLoading, collectibleTimestamps, stories, storyProgress, unifiedProgress, unlockItem, unlockAchievement, toggleActiveAchievement, swapActiveAchievement, resetGameData, refreshData, polishCollectible, completeStory, findCollectible]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

// Convenience hook for accessing unified progress across all game systems
export function useUnifiedProgress() {
  const { achievements, collectionSets, collectibleTimestamps, stories, storyProgress, unifiedProgress } = useGame();
  
  // Get all collectibles with their collection state
  const allCollectibles = useMemo(() => 
    collectionSets.flatMap(set => 
      set.items.map(item => ({
        ...item,
        setId: set.id,
        setTitle: set.title,
        isCollected: set.collected.includes(item.id),
        timestamps: collectibleTimestamps[item.id],
      }))
    ), [collectionSets, collectibleTimestamps]);
  
  // Get recent unlocks (sorted by date, most recent first)
  const recentUnlocks = useMemo(() => {
    return unifiedProgress.slice(0, 10); // Return top 10 most recent
  }, [unifiedProgress]);

  // Stats summary
  const stats = useMemo(() => ({
    totalAchievements: achievements.length,
    unlockedAchievements: achievements.filter(a => a.unlocked).length,
    totalCollectibles: allCollectibles.length,
    collectedItems: allCollectibles.filter(c => c.isCollected).length,
    totalStories: stories.length,
    completedStories: Object.values(storyProgress).filter(p => p.isCompleted).length,
  }), [achievements, allCollectibles, stories, storyProgress]);
  
  return { 
    allCollectibles, 
    recentUnlocks, 
    unifiedProgress,
    stats,
  };
}
