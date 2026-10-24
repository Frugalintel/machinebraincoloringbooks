import { displayEm } from "@/lib/store";
import type { StoryMapMode, StoryMapNodeInput } from "@/lib/story-map";
import type { StoryWorld } from "@/lib/story-world";

export type StoryAction =
  | { type: "continue"; href: string; label: "Continue" }
  | { type: "begin"; href: string; label: "Begin" }
  | { type: "sign-in"; label: "Sign in to read" }
  | { type: "book"; href: string; label: "Get the book" }
  | { type: "code"; label: "Code required" };

export function storyMapMode(input: {
  signedIn: boolean;
  unlocked: boolean;
  reading: boolean;
}): StoryMapMode {
  if (!input.signedIn) return "open";
  if (!input.unlocked) return "ghost";
  if (input.reading) return "lit";
  return "open";
}

export function storyStateWord(input: {
  signedIn: boolean;
  unlocked: boolean;
  reading: boolean;
  codeNeeded: boolean;
  cost?: number;
}): string {
  if (input.unlocked && input.reading) return "Yours · reading";
  if (input.unlocked) return "Yours";
  if (input.cost !== undefined) return `${input.cost} pts`;
  if (input.signedIn && input.codeNeeded) return "Code required";
  return "Locked";
}

export function storyAction(input: {
  signedIn: boolean;
  unlocked: boolean;
  reading: boolean;
  productHref?: string;
  href: string;
}): StoryAction {
  if (input.unlocked && input.reading) {
    return { type: "continue", href: input.href, label: "Continue" };
  }
  if (input.unlocked) {
    return { type: "begin", href: input.href, label: "Begin" };
  }
  if (input.productHref) {
    return { type: "book", href: input.productHref, label: "Get the book" };
  }
  if (!input.signedIn) return { type: "sign-in", label: "Sign in to read" };
  return { type: "code", label: "Code required" };
}

export function storyPointsNote(input: {
  cost?: number;
  balance?: number;
  locked: boolean;
}): string | undefined {
  if (
    !input.locked ||
    input.cost === undefined ||
    input.balance === undefined
  ) {
    return undefined;
  }
  if (input.balance < input.cost) {
    return `This one is ${input.cost} pts. You have ${input.balance}.`;
  }
  return `You have ${input.balance} pts.`;
}

export function isStoryUnlocked(input: {
  hasRequirements: boolean;
  hasCodeNeeded: boolean;
  hasProgress: boolean;
}): boolean {
  if (!input.hasRequirements && !input.hasCodeNeeded) return true;
  return input.hasProgress;
}

export function isStoryReading(input: {
  unlocked: boolean;
  completed: boolean;
  completedCount: number;
  currentId: string | null;
}): boolean {
  if (!input.unlocked || input.completed) return false;
  return input.completedCount > 0 || Boolean(input.currentId);
}

export function pickLeadStory<
  T extends { id: string; reading: boolean; startedAt?: string },
>(stories: readonly T[]): T | null {
  const reading = stories.filter((story) => story.reading);
  if (reading.length === 0) return null;
  return (
    [...reading].sort((a, b) =>
      (a.startedAt ?? "").localeCompare(b.startedAt ?? ""),
    )[reading.length - 1] ?? null
  );
}

/** Signed out, the first story is the unlit featured map. None when the list is empty. */
export function pickFeaturedStory<T>(stories: readonly T[]): T | null {
  return stories[0] ?? null;
}

export function titleLines(
  title: string,
  preset?: readonly string[],
): string[] {
  const given = preset?.map((line) => line.trim()).filter(Boolean);
  if (given && given.length > 0) return given;
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [title.trim()];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/** Shared Inter size so the longest card title stays inside the column. */
export function cardTitleFit(lines: readonly (readonly string[])[]): {
  desktop: number;
  mobile: number;
} {
  let desktop = 0;
  let mobile = 0;
  for (const group of lines) {
    const joined = group.join(" ");
    desktop = Math.max(desktop, displayEm(joined));
    for (const line of group) mobile = Math.max(mobile, displayEm(line));
  }
  return {
    desktop: desktop || 1,
    mobile: mobile || 1,
  };
}

export function plateNumber(index: number): string {
  return `No. ${String(index + 1).padStart(2, "0")}`;
}

export function minutesLabel(minutes: number | undefined): string | undefined {
  if (minutes === undefined || !Number.isFinite(minutes) || minutes <= 0) {
    return undefined;
  }
  return `About ${Math.round(minutes)} min`;
}

export function whereLine(input: {
  reading: boolean;
  currentLabel?: string;
  hasNext: boolean;
  synopsis: string;
}): string {
  if (!input.reading || !input.currentLabel) return input.synopsis;
  if (input.hasNext) {
    return `You are at ${input.currentLabel}. The road splits again.`;
  }
  return `You are at ${input.currentLabel}.`;
}

export type StoryPassage = {
  id: string;
  paragraphs: string[];
  title: string;
  chose?: string;
};

export function paragraphsOf(content: string): string[] {
  const parts = content
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [content.trim()].filter(Boolean);
}

export function choiceTaken(
  nodes: readonly StoryMapNodeInput[],
  fromId: string | undefined,
  toId: string,
): string | undefined {
  if (!fromId) return undefined;
  const from = nodes.find((node) => node.id === fromId);
  const text = from?.choices
    ?.find((choice) => choice.nextNodeId === toId)
    ?.text.trim();
  return text || undefined;
}

export type { StoryWorld };
