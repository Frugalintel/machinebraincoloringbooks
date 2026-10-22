import { Story } from "@/lib/types";

const DEFAULT_THEME_CLASSES = {
  bgAccent: "bg-signal",
  bgAccentLight: "bg-cream/5",
  textAccent: "text-signal",
  borderAccent: "border-line",
  gradient: "from-cream/5 via-transparent to-transparent",
};

// Unified theme configuration.
// Keys and the lookup API stay so stored stories still resolve; hues are the brand mapping.
export const STORY_THEMES = {
  signal: {
    id: "signal",
    accent: "emerald",
    ...DEFAULT_THEME_CLASSES,
  },
  neon: {
    id: "neon",
    accent: "fuchsia",
    ...DEFAULT_THEME_CLASSES,
  },
  default: {
    id: "default",
    accent: "primary",
    ...DEFAULT_THEME_CLASSES,
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
