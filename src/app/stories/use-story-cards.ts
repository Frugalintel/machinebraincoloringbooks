"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import {
  isStoryReading,
  isStoryUnlocked,
  titleLines,
} from "@/lib/story-catalog";
import type { StoryMapNodeInput } from "@/lib/story-map";
import { getStoryPoints } from "@/lib/story-points";
import type { SampleStoryView } from "@/lib/story-samples";
import { storyWorld, type StoryWorld } from "@/lib/story-world";
import type { Story, StoryRequirement, UserStoryProgress } from "@/lib/types";

export type StoryCard = {
  id: string;
  title: string;
  lines: string[];
  synopsis: string;
  minutes?: number;
  world: StoryWorld;
  nodes: StoryMapNodeInput[];
  cover?: string;
  lineArt?: string;
  sample: boolean;
  cost?: number;
  balance?: number;
  unlocked: boolean;
  reading: boolean;
  startedAt?: string;
  completedIds: string[];
  currentId: string | null;
  currentLabel?: string;
  hasNext: boolean;
  productHref?: string;
  codeNeeded: boolean;
  signedIn: boolean;
};

type StoryRecord = Story & {
  category?: string | null;
  cost_pts?: unknown;
  points_cost?: unknown;
  point_price?: unknown;
};

function nodesFrom(story: StoryRecord): StoryMapNodeInput[] {
  return (story.content ?? []).map((node) => {
    const content = node.content?.trim() ?? "";
    const label =
      content && content.length <= 42 && !content.includes(".")
        ? content
        : undefined;
    return {
      id: node.id,
      label,
      choices: node.choices ?? [],
      position: node.position,
    };
  });
}

function cardFromSample(
  story: SampleStoryView,
  mode: "visitor" | "reader",
  balance: number | undefined,
): StoryCard {
  const reader = mode === "reader";
  const unlocked = reader && story.state !== "locked";
  const reading = reader && story.state === "reading";
  const current = story.nodes.find((node) => node.id === story.currentId);
  const readerBalance = reader ? balance : undefined;
  return {
    id: story.id,
    title: story.title,
    lines: titleLines(story.title, story.lines),
    synopsis: story.synopsis,
    minutes: story.minutes,
    world: storyWorld(story.worldName),
    nodes: story.nodes,
    cover: story.artSmall,
    lineArt: story.lineArt,
    sample: true,
    cost: story.cost,
    balance: readerBalance,
    unlocked,
    reading,
    completedIds: reading ? story.completedIds : [],
    currentId: reading ? story.currentId : null,
    currentLabel: reading ? current?.label : undefined,
    hasNext: reading ? (current?.choices?.length ?? 0) > 0 : false,
    codeNeeded: false,
    signedIn: reader,
  };
}

function cardFromStory(
  story: StoryRecord,
  progress: UserStoryProgress | undefined,
  productIds: Record<string, string>,
  signedIn: boolean,
): StoryCard {
  const hasRequirements = (story.requirements?.length ?? 0) > 0;
  const codeNeeded = Boolean(story.code_needed?.trim());
  const unlocked = isStoryUnlocked({
    hasRequirements,
    hasCodeNeeded: codeNeeded,
    hasProgress: Boolean(progress),
  });
  const reading = isStoryReading({
    unlocked,
    completed: Boolean(progress?.is_completed),
    completedCount: progress?.completed_nodes?.length ?? 0,
    currentId: progress?.current_node_id ?? null,
  });
  const nodes = nodesFrom(story);
  const current = nodes.find((node) => node.id === progress?.current_node_id);
  const points = getStoryPoints(story);
  const productName = story.requirements?.find(
    (requirement: StoryRequirement) => requirement.type === "product",
  )?.name;
  const productId = productName ? productIds[productName] : undefined;
  return {
    id: story.id,
    title: story.title,
    lines: titleLines(story.title),
    synopsis: story.synopsis ?? "",
    minutes: story.estimated_minutes,
    world: storyWorld(story.category),
    nodes,
    cover: story.cover_url || undefined,
    sample: false,
    cost: points.cost,
    balance: points.balance,
    unlocked,
    reading,
    startedAt: progress?.started_at,
    completedIds: progress?.completed_nodes ?? [],
    currentId: progress?.current_node_id ?? null,
    currentLabel: current?.label,
    hasNext: (current?.choices?.length ?? 0) > 0,
    productHref: productId ? `/store/${productId}` : undefined,
    codeNeeded,
    signedIn,
  };
}

export function useStoryCards(
  samples: boolean,
  fixture: boolean,
  catalog: readonly SampleStoryView[] = [],
  samplePoints?: number,
) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id;
  const [cards, setCards] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(!fixture);
  const signedIn = fixture || Boolean(userId);

  useEffect(() => {
    if (fixture) {
      setCards(
        catalog.map((story) => cardFromSample(story, "reader", samplePoints)),
      );
      setLoading(false);
      return;
    }
    if (isAuthLoading) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data: storyData } = await supabase
          .from("stories")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: true });

        const stories = (storyData ?? []) as StoryRecord[];
        const unique = Array.from(
          new Map(stories.map((story) => [story.id, story])).values(),
        );
        const names = unique
          .map(
            (story) =>
              story.requirements?.find(
                (requirement) => requirement.type === "product",
              )?.name,
          )
          .filter((name): name is string => Boolean(name));
        const productIds: Record<string, string> = {};
        if (names.length > 0) {
          const { data: products } = await supabase
            .from("products")
            .select("id, title")
            .in("title", names);
          for (const product of products ?? []) {
            productIds[product.title] = product.id;
          }
        }

        let progress: UserStoryProgress[] = [];
        if (userId) {
          const { data: rows } = await supabase
            .from("user_story_progress")
            .select("*")
            .eq("user_id", userId);
          progress = (rows ?? []) as UserStoryProgress[];
        }

        const real = unique.map((story) =>
          cardFromStory(
            story,
            progress.find((row) => row.story_id === story.id),
            productIds,
            Boolean(userId),
          ),
        );
        const next =
          real.length > 0 || userId
            ? real
            : catalog.map((story) =>
                cardFromSample(story, "visitor", samplePoints),
              );
        if (!cancelled) setCards(next);
      } catch (error) {
        logger.error("Error loading stories:", error);
        if (!cancelled) {
          setCards(
            userId
              ? []
              : catalog.map((story) =>
                  cardFromSample(story, "visitor", samplePoints),
                ),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [catalog, fixture, isAuthLoading, samplePoints, samples, userId]);

  useEffect(() => {
    if (fixture || !user?.id) return;
    const refresh = () => {
      void supabase
        .from("user_story_progress")
        .select("*")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (!data) return;
          const rows = data as UserStoryProgress[];
          setCards((current) =>
            current.map((card) => {
              if (card.sample) return card;
              const row = rows.find((item) => item.story_id === card.id);
              if (!row) return card;
              const unlocked = true;
              const reading = isStoryReading({
                unlocked,
                completed: Boolean(row.is_completed),
                completedCount: row.completed_nodes?.length ?? 0,
                currentId: row.current_node_id ?? null,
              });
              const currentNode = card.nodes.find(
                (node) => node.id === row.current_node_id,
              );
              return {
                ...card,
                unlocked,
                reading,
                signedIn: true,
                startedAt: row.started_at,
                completedIds: row.completed_nodes ?? [],
                currentId: row.current_node_id ?? null,
                currentLabel: currentNode?.label,
                hasNext: (currentNode?.choices?.length ?? 0) > 0,
              };
            }),
          );
        });
    };
    window.addEventListener("story-unlocked", refresh);
    return () => window.removeEventListener("story-unlocked", refresh);
  }, [fixture, user?.id]);

  const balance = fixture
    ? samplePoints
    : cards.find((card) => card.balance !== undefined)?.balance;

  return {
    cards,
    loading: loading || (!fixture && isAuthLoading),
    signedIn,
    balance,
    sampleBalance: fixture || cards.some((card) => card.sample),
  };
}
