"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Crown,
  Gem,
  Award,
  Sparkles,
  BookOpen,
  Frame,
} from "lucide-react";
import type { RewardType } from "@/lib/types";

interface RewardBadgeProps {
  type: RewardType;
  value: string;
  label: string;
  earned?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  onClick?: () => void;
  className?: string;
}

const REWARD_CONFIG: Record<
  RewardType,
  { icon: typeof Trophy; color: string; bgColor: string }
> = {
  trophy_skin: {
    icon: Trophy,
    color: "text-signal",
    bgColor: "bg-cream/5 border-line",
  },
  trophy_pedestal: {
    icon: Gem,
    color: "text-signal",
    bgColor: "bg-cream/5 border-line",
  },
  profile_frame: {
    icon: Frame,
    color: "text-signal",
    bgColor: "bg-cream/5 border-line",
  },
  title: {
    icon: Crown,
    color: "text-warning",
    bgColor: "bg-warning/10 border-yellow-500/30",
  },
  trophy_room_theme: {
    icon: Sparkles,
    color: "text-signal",
    bgColor: "bg-cream/5 border-line",
  },
  badge_border: {
    icon: Award,
    color: "text-fg-muted",
    bgColor: "bg-cream/5 border-line",
  },
  mastery_badge: {
    icon: BookOpen,
    color: "text-signal",
    bgColor: "bg-cream/5 border-emerald-500/30",
  },
};

const SIZE_CONFIG = {
  sm: {
    container: "p-2",
    icon: 14,
    label: "text-[9px]",
    value: "text-xs",
  },
  md: {
    container: "p-3",
    icon: 18,
    label: "text-[10px]",
    value: "text-sm",
  },
  lg: {
    container: "p-4",
    icon: 24,
    label: "text-xs",
    value: "text-base",
  },
};

export function RewardBadge({
  type,
  value,
  label,
  earned = false,
  size = "md",
  showLabel = true,
  animated = true,
  onClick,
  className = "",
}: RewardBadgeProps) {
  const config = REWARD_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const content = (
    <div
      className={`
        border ${config.bgColor} ${sizeConfig.container} 
        ${onClick ? "cursor-pointer hover:opacity-80" : ""}
        ${!earned ? "opacity-50 grayscale" : ""}
        transition-all
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className={`${config.color}`}>
          <Icon size={sizeConfig.icon} />
        </div>
        <div className="flex-1 min-w-0">
          {showLabel ? (
            <span
              className={`block ${sizeConfig.label} text-fg-muted uppercase tracking-widest font-mono truncate`}
            >
              {label}
            </span>
          ) : null}
          <span
            className={`block ${sizeConfig.value} ${config.color} font-heading truncate`}
          >
            {value}
          </span>
        </div>
        {earned ? (
          <Star
            size={sizeConfig.icon - 4}
            className="text-warning"
            fill="currentColor"
          />
        ) : null}
      </div>
    </div>
  );

  if (animated && earned) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

interface RewardUnlockAnimationProps {
  type: RewardType;
  label: string;
  onComplete?: () => void;
}

export function RewardUnlockAnimation({
  type,
  label,
  onComplete,
}: RewardUnlockAnimationProps) {
  const config = REWARD_CONFIG[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 15, delay: 0.2 }}
        className="text-center"
      >
        {/* Glow effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0.5], scale: [0.5, 1.5, 1] }}
          transition={{ duration: 1, delay: 0.3 }}
          className={`absolute inset-0 blur-3xl ${config.bgColor} opacity-50`}
        />

        {/* Icon */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4 }}
          className={`w-24 h-24 mx-auto mb-6 flex items-center justify-center border-2 ${config.bgColor} ${config.color}`}
        >
          <Icon size={48} />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className=" text-fg-muted uppercase tracking-widest font-label mb-2">
            Reward Unlocked
          </p>
          <h2 className={`font-heading text-3xl ${config.color} tracking-wide`}>
            {label}
          </h2>
        </motion.div>

        {/* Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: Math.cos((i * 45 * Math.PI) / 180) * 100,
              y: Math.sin((i * 45 * Math.PI) / 180) * 100,
            }}
            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
            className={`absolute w-2 h-2 ${config.color.replace("text-", "bg-")}`}
            style={{ left: "50%", top: "50%" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

interface MilestonePreviewProps {
  current: number;
  next?: {
    threshold: number;
    reward: {
      type: RewardType;
      value: string;
      label: string;
    };
  };
  pillarLabel: string;
  className?: string;
}

export function MilestonePreview({
  current,
  next,
  pillarLabel,
  className = "",
}: MilestonePreviewProps) {
  if (!next) {
    return (
      <div className={`bg-background border border-line p-4 ${className}`}>
        <div className="flex items-center gap-2 text-fg-muted uppercase tracking-widest font-label">
          <Star size={12} className="text-warning" fill="currentColor" />
          <span>All {pillarLabel} Milestones Complete!</span>
        </div>
      </div>
    );
  }

  const progress = Math.min(100, (current / next.threshold) * 100);

  return (
    <div className={`bg-background border border-line p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className=" text-fg-muted uppercase tracking-widest font-label">
          Next {pillarLabel} Milestone
        </span>
        <span className=" text-fg-muted font-label">
          {current} / {next.threshold}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-2 mb-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-primary to-amber-500"
        />
      </div>

      {/* Reward preview */}
      <RewardBadge
        type={next.reward.type}
        value={next.reward.value}
        label={next.reward.label}
        earned={false}
        size="sm"
      />
    </div>
  );
}
