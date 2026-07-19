import { Story } from "@/lib/types";

// Unified theme configuration
export const STORY_THEMES = {
  signal: {
    id: "signal",
    accent: "emerald",
    bgAccent: "bg-emerald-500",
    bgAccentLight: "bg-emerald-500/10",
    textAccent: "text-emerald-500",
    borderAccent: "border-emerald-500",
    gradient: "from-emerald-500/20 via-transparent to-transparent",
  },
  neon: {
    id: "neon",
    accent: "fuchsia",
    bgAccent: "bg-fuchsia-500",
    bgAccentLight: "bg-fuchsia-500/10",
    textAccent: "text-fuchsia-500",
    borderAccent: "border-fuchsia-500",
    gradient: "from-fuchsia-500/20 via-transparent to-transparent",
  },
  default: {
    id: "default",
    accent: "primary",
    bgAccent: "bg-primary",
    bgAccentLight: "bg-primary/10",
    textAccent: "text-primary",
    borderAccent: "border-primary",
    gradient: "from-primary/20 via-transparent to-transparent",
  },
};

export type StoryTheme = typeof STORY_THEMES.default;

export function getStoryTheme(title: string): StoryTheme {
  const lower = title.toLowerCase();
  if (lower.includes("signal")) return STORY_THEMES.signal;
  if (lower.includes("neon")) return STORY_THEMES.neon;
  return STORY_THEMES.default;
}

export function getStoryCoverImage(story: Story): string {
  const lower = story.title.toLowerCase();
  if (lower.includes("signal")) return "/stories/the-signal.png";
  if (lower.includes("neon")) return "/stories/neon-dreams.png";
  return story.cover_url || "";
}

// Shared constants
export const ADVENTURES_COPY = {
  pillarName: "Interactive Adventures",
  pillarTagline: "Bonus interactive chapters from your coloring books",
  badge: "Interactive",
  lockedLabel: "Locked",
  unlockedLabel: "Unlocked",
  codePrompt: "Enter your book code to unlock",
};

// Interactive Badge Component Props
export interface InteractiveBadgeProps {
  theme: StoryTheme;
  size?: "sm" | "md";
}
