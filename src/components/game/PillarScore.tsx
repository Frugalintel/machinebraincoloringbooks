"use client";

import { motion } from "framer-motion";
import { Trophy, Star, BookOpen, Sparkles } from "lucide-react";

export type PillarType = "collector" | "achievement" | "story" | "mastery";

interface PillarScoreProps {
  pillar: PillarType;
  score: number;
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

const PILLAR_CONFIG: Record<
  PillarType,
  { icon: typeof Trophy; color: string; gradient: string }
> = {
  collector: {
    icon: Trophy,
    color: "text-signal",
    gradient: "from-amber-500 to-orange-500",
  },
  achievement: {
    icon: Star,
    color: "text-signal",
    gradient: "from-purple-500 to-pink-500",
  },
  story: {
    icon: Sparkles,
    color: "text-primary",
    gradient: "from-primary to-red-500",
  },
  mastery: {
    icon: BookOpen,
    color: "text-signal",
    gradient: "from-emerald-500 to-teal-500",
  },
};

const SIZE_CONFIG = {
  sm: {
    container: "p-3",
    icon: 14,
    score: "text-xl",
    label: "text-[9px]",
  },
  md: {
    container: "p-4",
    icon: 18,
    score: "text-2xl",
    label: "text-[10px]",
  },
  lg: {
    container: "p-6",
    icon: 24,
    score: "text-4xl",
    label: "text-xs",
  },
};

export function PillarScore({
  pillar,
  score,
  label,
  sublabel,
  size = "md",
  showIcon = true,
  animated = true,
  className = "",
}: PillarScoreProps) {
  const config = PILLAR_CONFIG[pillar];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const defaultLabels: Record<PillarType, string> = {
    collector: "Collector Score",
    achievement: "Achievement Score",
    story: "Total XP",
    mastery: "Mastery Score",
  };

  return (
    <div
      className={`bg-background border border-line ${sizeConfig.container} ${className}`}
    >
      <div className="flex items-center gap-3">
        {showIcon ? (
          <div
            className={`w-10 h-10 flex items-center justify-center border border-line bg-background ${config.color}`}
          >
            <Icon size={sizeConfig.icon} />
          </div>
        ) : null}
        <div className="flex-1">
          <span
            className={`block ${sizeConfig.label} text-fg-muted uppercase tracking-widest font-mono mb-1`}
          >
            {label || defaultLabels[pillar]}
          </span>
          <div className="flex items-baseline gap-2">
            {animated ? (
              <motion.span
                key={score}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`font-heading ${sizeConfig.score} ${config.color}`}
              >
                {score.toLocaleString()}
              </motion.span>
            ) : (
              <span
                className={`font-heading ${sizeConfig.score} ${config.color}`}
              >
                {score.toLocaleString()}
              </span>
            )}
            {sublabel ? (
              <span className={`${sizeConfig.label} text-fg-faint font-mono`}>
                {sublabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PillarProgressBarProps {
  pillar: PillarType;
  current: number;
  max: number;
  label?: string;
  showValues?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PillarProgressBar({
  pillar,
  current,
  max,
  label,
  showValues = true,
  size = "md",
  className = "",
}: PillarProgressBarProps) {
  const config = PILLAR_CONFIG[pillar];
  const percent = Math.min(100, (current / max) * 100);

  const heightClass = size === "sm" ? "h-1" : "h-2";

  return (
    <div className={className}>
      {label || showValues ? (
        <div className="flex items-center justify-between mb-2">
          {label ? (
            <span className=" text-fg-muted uppercase tracking-widest font-label">
              {label}
            </span>
          ) : null}
          {showValues ? (
            <span className={` font-label ${config.color}`}>
              {current} / {max}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className={`w-full ${heightClass} bg-surface-2 overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${config.gradient}`}
        />
      </div>
    </div>
  );
}

interface PillarStatsGridProps {
  stats: Array<{
    pillar: PillarType;
    score: number;
    label?: string;
  }>;
  columns?: 2 | 3 | 4;
  size?: "sm" | "md";
  className?: string;
}

export function PillarStatsGrid({
  stats,
  columns = 4,
  size = "sm",
  className = "",
}: PillarStatsGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3 ${className}`}>
      {stats.map((stat) => (
        <PillarScore
          key={stat.pillar}
          pillar={stat.pillar}
          score={stat.score}
          label={stat.label}
          size={size}
        />
      ))}
    </div>
  );
}
