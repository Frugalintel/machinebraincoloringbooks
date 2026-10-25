import { toSentenceCase } from "@/lib/display-text";

export type StoryWorld = {
  id: string;
  name: string;
};

/**
 * Worlds are still an open mapping. Until a story has its own world,
 * group and filter by the category it already stores.
 */
export function storyWorld(category: string | null | undefined): StoryWorld {
  const name = category?.trim() ?? "";
  if (!name) return { id: "stories", name: "Stories" };
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "stories";
  return { id, name: toSentenceCase(name) };
}

export function storyWorlds<T extends { world: StoryWorld }>(
  stories: readonly T[],
): StoryWorld[] {
  const worlds: StoryWorld[] = [];
  for (const story of stories) {
    if (story.world.id === "stories") continue;
    if (worlds.some((world) => world.id === story.world.id)) continue;
    worlds.push(story.world);
  }
  return worlds;
}
