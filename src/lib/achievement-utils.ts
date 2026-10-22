import {
  Trophy,
  Medal,
  Crown,
  Star,
  Gem,
  Zap,
  Rocket,
  Sword,
  Shield,
  Map,
  Brush,
  Code,
  Lock,
  Heart,
  Smile,
  Terminal,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  star: Star,
  gem: Gem,
  zap: Zap,
  rocket: Rocket,
  sword: Sword,
  shield: Shield,
  map: Map,
  brush: Brush,
  code: Code,
  lock: Lock,
  heart: Heart,
  smile: Smile,
  terminal: Terminal,
};

export const getIconComponent = (iconName: string) => {
  const Icon = ICON_MAP[iconName.toLowerCase()] || Trophy;
  return Icon;
};

export const getRarityStyles = (rarity?: string) => {
  switch (rarity?.toLowerCase()) {
    case "legendary":
      return {
        border: "border-signal hover:border-signal",
        glow: "shadow-[0_0_30px_-5px_color-mix(in_srgb,var(--signal)_40%,transparent)]",
        icon: "bg-cream/5 text-signal border-signal",
        text: "text-signal",
        bg: "bg-background",
        accent: "bg-cream",
        titleColor: "text-signal",
        progressColor: "from-cream to-cream",
      };
    case "epic":
      return {
        border: "border-cream hover:border-cream",
        glow: "shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--cream)_20%,transparent)]",
        icon: "bg-surface-3 text-cream border-cream",
        text: "text-cream",
        bg: "bg-surface-3",
        accent: "bg-cream",
        titleColor: "text-cream",
        progressColor: "from-cream to-fg-secondary",
      };
    case "rare":
      return {
        border: "border-fg-secondary hover:border-fg-secondary",
        glow: "",
        icon: "bg-surface-2 text-cream border-fg-secondary",
        text: "text-cream",
        bg: "bg-surface-1",
        accent: "bg-fg-secondary",
        titleColor: "text-cream",
        progressColor: "from-fg-secondary to-cream",
      };
    case "uncommon":
      return {
        border: "border-fg-muted hover:border-fg-muted",
        glow: "",
        icon: "bg-surface-2 text-fg-secondary border-fg-muted",
        text: "text-fg-secondary",
        bg: "bg-surface-1",
        accent: "bg-fg-secondary",
        titleColor: "text-fg-secondary",
        progressColor: "from-fg-muted to-fg-secondary",
      };
    default:
      return {
        border: "border-line-strong hover:border-line-strong",
        glow: "",
        icon: "bg-surface-2 text-fg-muted border-line-strong",
        text: "text-fg-muted",
        bg: "bg-surface-1",
        accent: "bg-fg-faint",
        titleColor: "text-cream",
        progressColor: "from-fg-faint to-fg-muted",
      };
  }
};

export const getAchievementProgress = (progressStr?: string): number => {
  if (!progressStr) return 0;
  const match = progressStr.match(/(\d+)\/(\d+)/);
  if (match) {
    return Math.min(
      100,
      Math.max(0, (parseInt(match[1]) / parseInt(match[2])) * 100),
    );
  }
  return 0;
};
