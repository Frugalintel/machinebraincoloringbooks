import sampleData from "@/data/stories.sample.json";
import { homeShowsSamples } from "@/lib/home";
import type { StoryMapNodeInput } from "@/lib/story-map";
import { getStoryPoints } from "@/lib/story-points";
import { storyWorld } from "@/lib/story-world";

export const storiesShowSamples = homeShowsSamples;

type SampleTree = [string, string, SampleTree[]];

type SampleChapter = {
  id: string;
  title: string;
  text: string[];
  chose?: string;
  choices?: string[];
};

type SampleStory = {
  id: string;
  world: string;
  title: string;
  lines: string[];
  art: string;
  synopsis: string;
  minutes: number;
  cost: number;
  state: "reading" | "open" | "locked";
  path?: string[];
  current?: string;
  tree: SampleTree;
  chapters?: SampleChapter[];
};

type SampleFile = {
  reader: { name: string; points: number };
  worlds: { id: string; name: string }[];
  stories: SampleStory[];
};

const sample = sampleData as unknown as SampleFile;

export type SampleChapterView = {
  id: string;
  title: string;
  paragraphs: string[];
  chose?: string;
  choices?: { text: string; nextNodeId: string }[];
};

export type SampleStoryView = {
  id: string;
  title: string;
  lines: string[];
  synopsis: string;
  minutes: number;
  art: string;
  artSmall: string;
  lineArt?: string;
  worldName: string;
  nodes: StoryMapNodeInput[];
  chapters: SampleChapterView[];
  cost?: number;
  state: SampleStory["state"];
  completedIds: string[];
  currentId: string | null;
  sample: true;
};

function asTree(value: unknown): SampleTree | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const [id, label, children] = value;
  if (
    typeof id !== "string" ||
    typeof label !== "string" ||
    !Array.isArray(children)
  ) {
    return null;
  }
  const nested = children
    .map((child) => asTree(child))
    .filter((child): child is SampleTree => child !== null);
  return [id, label, nested];
}

function flattenTree(tree: SampleTree): StoryMapNodeInput[] {
  const nodes: StoryMapNodeInput[] = [];
  const walk = (node: SampleTree) => {
    const [id, label, children] = node;
    nodes.push({
      id,
      label: label.trim() || undefined,
      choices: children.map((child) => ({
        text: child[1].trim() || child[0],
        nextNodeId: child[0],
      })),
    });
    children.forEach(walk);
  };
  walk(tree);
  return nodes;
}

function worldName(id: string): string {
  return sample.worlds.find((world) => world.id === id)?.name ?? id;
}

function toView(
  story: SampleStory,
  balance: number | undefined,
): SampleStoryView {
  const points = getStoryPoints({ cost_pts: story.cost }, { points: balance });
  const completed = (story.path ?? []).filter((id) => id !== story.current);
  const tree = asTree(story.tree);
  const nodes = tree ? flattenTree(tree) : [];
  return {
    id: story.id,
    title: story.title,
    lines: story.lines,
    synopsis: story.synopsis,
    minutes: story.minutes,
    art: `/stories/sample/${story.art}.webp`,
    artSmall: `/stories/sample/${story.art}-720.webp`,
    lineArt:
      story.art === "lantern" ? "/stories/sample/lantern-line.webp" : undefined,
    worldName: worldName(story.world),
    nodes,
    chapters: (story.chapters ?? []).map((chapter) => {
      const node = nodes.find((item) => item.id === chapter.id);
      return {
        id: chapter.id,
        title: chapter.title,
        paragraphs: chapter.text,
        chose: chapter.chose,
        choices: node?.choices?.map((choice) => ({
          text: choice.text,
          nextNodeId: choice.nextNodeId,
        })),
      };
    }),
    cost: points.cost,
    state: story.state,
    completedIds: completed,
    currentId: story.current ?? null,
    sample: true,
  };
}

export function sampleStories(enabled: boolean): SampleStoryView[] {
  if (!enabled) return [];
  const balance = getStoryPoints(null, {
    points: sample.reader.points,
  }).balance;
  return sample.stories.map((story) => toView(story, balance));
}

export function sampleStory(
  enabled: boolean,
  id: string,
): SampleStoryView | undefined {
  return sampleStories(enabled).find((story) => story.id === id);
}

export function sampleBalance(enabled: boolean): number | undefined {
  if (!enabled) return undefined;
  return getStoryPoints(null, { points: sample.reader.points }).balance;
}

/** Confirms the sample world name still flows through the category mapping. */
export function sampleWorld(name: string) {
  return storyWorld(name);
}
