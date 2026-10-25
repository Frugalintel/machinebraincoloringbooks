"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";
import {
  collectiblesPreview,
  fixtureCollectedIds,
  fixtureStamps,
} from "@/lib/collectibles-fixture";
import {
  buildDetail,
  buildVitrine,
  type DetailModel,
  type VitrineInput,
  type VitrineModel,
} from "@/lib/collectibles-view";
import { achievements, collectionSets } from "@/lib/game-data";

export function useCollectiblesInput(allowFixture: boolean): VitrineInput {
  const params = useSearchParams();
  const { user } = useAuth();
  const {
    collectionSets: userSets,
    collectibleTimestamps,
    stories,
  } = useGame();
  const preview = collectiblesPreview(allowFixture, params.get("preview"));
  const setFilter = params.get("set");

  return useMemo(() => {
    let signedIn = Boolean(user);
    let collectedIds = new Set<string>();
    let stamps = collectibleTimestamps;

    if (preview === "out") {
      signedIn = false;
      stamps = {};
    } else if (preview === "none") {
      signedIn = true;
      stamps = {};
    } else if (preview === "some") {
      signedIn = true;
      collectedIds = fixtureCollectedIds();
      stamps = fixtureStamps();
    } else if (signedIn) {
      for (const set of userSets) {
        for (const id of set.collected) collectedIds.add(id);
      }
    }

    const storyRefs = stories
      .filter((story) => story.id && story.title)
      .map((story) => ({ id: story.id, title: story.title }));

    return {
      catalog: collectionSets,
      signedIn,
      collectedIds,
      stamps,
      stories: storyRefs,
      achievements,
      setFilter,
    };
  }, [collectibleTimestamps, preview, setFilter, stories, user, userSets]);
}

export function useVitrine(allowFixture: boolean): VitrineModel {
  const input = useCollectiblesInput(allowFixture);
  return useMemo(() => buildVitrine(input), [input]);
}

export function useCollectibleDetail(
  allowFixture: boolean,
  itemId: string,
): DetailModel | null {
  const input = useCollectiblesInput(allowFixture);
  return useMemo(() => buildDetail({ ...input, itemId }), [input, itemId]);
}
