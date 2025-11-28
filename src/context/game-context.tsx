"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { collectionSets as initialSets, achievements as initialAchievements, type CollectionSet, type Achievement } from "@/lib/game-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

type GameContextType = {
  collectionSets: CollectionSet[];
  achievements: Achievement[];
  activeAchievementIds: string[];
  isLoading: boolean;
  unlockItem: (setId: string, itemId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  toggleActiveAchievement: (achievementId: string) => void;
  resetGameData: () => void;
  refreshData: () => Promise<void>;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [collectionSets, setCollectionSets] = useState<CollectionSet[]>(initialSets);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [activeAchievementIds, setActiveAchievementIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user data from database
  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      // Reset to defaults when logged out
      setCollectionSets(initialSets);
      setAchievements(initialAchievements);
      setActiveAchievementIds(initialAchievements.slice(0, 5).map(a => a.id));
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
        console.error('Error fetching achievements:', achError);
      }

      // Fetch unlocked collectibles
      const { data: unlockedCollectibles, error: collError } = await supabase
        .from('user_collectibles')
        .select('collectible_id, set_id')
        .eq('user_id', user.id);

      if (collError) {
        console.error('Error fetching collectibles:', collError);
      }

      // Fetch active achievement loadout
      const { data: activeData, error: activeError } = await supabase
        .from('user_active_achievements')
        .select('achievement_ids')
        .eq('user_id', user.id)
        .single();

      if (activeError && activeError.code !== 'PGRST116') {
        console.error('Error fetching active achievements:', activeError);
      }

      // Merge unlocked achievements with initial data
      const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);
      const mergedAchievements = initialAchievements.map(ach => ({
        ...ach,
        unlocked: unlockedIds.has(ach.id) || ach.unlocked,
      }));
      setAchievements(mergedAchievements);

      // Merge unlocked collectibles with initial data
      const collectedBySet: Record<string, string[]> = {};
      unlockedCollectibles?.forEach(c => {
        if (c.set_id) {
          if (!collectedBySet[c.set_id]) collectedBySet[c.set_id] = [];
          collectedBySet[c.set_id].push(c.collectible_id);
        }
      });
      
      const mergedSets = initialSets.map(set => ({
        ...set,
        collected: [...new Set([...set.collected, ...(collectedBySet[set.id] || [])])],
      }));
      setCollectionSets(mergedSets);

      // Set active achievements
      if (activeData?.achievement_ids && Array.isArray(activeData.achievement_ids)) {
        setActiveAchievementIds(activeData.achievement_ids);
      } else {
        setActiveAchievementIds(initialAchievements.slice(0, 5).map(a => a.id));
      }

    } catch (error) {
      console.error('Error fetching game data:', error);
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

    // Save to database if logged in
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_collectibles')
          .upsert({
            user_id: user.id,
            collectible_id: itemId,
            set_id: setId,
          }, {
            onConflict: 'user_id,collectible_id'
          });

        if (error) {
          console.error('Error saving collectible:', error);
        }
      } catch (err) {
        console.error('Error saving collectible:', err);
      }
    }
  }, [user?.id]);

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
          console.error('Error saving achievement:', error);
        }
      } catch (err) {
        console.error('Error saving achievement:', err);
      }
    }
  }, [user?.id]);

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
            console.error('Error saving active achievements:', error);
          }
        } catch (err) {
          console.error('Error saving active achievements:', err);
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
      
      window.location.reload();
    } catch (error) {
      console.error('Error resetting game data:', error);
    }
  }, [user?.id]);

  const refreshData = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  const value = useMemo(() => ({
    collectionSets,
    achievements,
    activeAchievementIds,
    isLoading,
    unlockItem,
    unlockAchievement,
    toggleActiveAchievement,
    resetGameData,
    refreshData,
  }), [collectionSets, achievements, activeAchievementIds, isLoading, unlockItem, unlockAchievement, toggleActiveAchievement, resetGameData, refreshData]);

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
