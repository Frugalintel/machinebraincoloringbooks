"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Gift,
  Trophy,
  Star,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type InvitationType = "collectibles" | "achievements" | "stories" | "mastery";

interface InvitationCardProps {
  type: InvitationType;
  title: string;
  standaloneReward: string;
  crossPillarInvitation?: string;
  ctaText: string;
  ctaLink: string;
  variant?: "default" | "compact" | "banner";
  onDismiss?: () => void;
  className?: string;
}

const TYPE_CONFIG: Record<
  InvitationType,
  { icon: typeof Trophy; color: string; bgGradient: string }
> = {
  collectibles: {
    icon: Trophy,
    color: "text-signal",
    bgGradient: "from-amber-500/10 to-transparent",
  },
  achievements: {
    icon: Star,
    color: "text-signal",
    bgGradient: "from-purple-500/10 to-transparent",
  },
  stories: {
    icon: Sparkles,
    color: "text-primary",
    bgGradient: "from-primary/10 to-transparent",
  },
  mastery: {
    icon: BookOpen,
    color: "text-signal",
    bgGradient: "from-emerald-500/10 to-transparent",
  },
};

export function InvitationCard({
  type,
  title,
  standaloneReward,
  crossPillarInvitation,
  ctaText,
  ctaLink,
  variant = "default",
  onDismiss,
  className = "",
}: InvitationCardProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-background border border-line p-3 relative overflow-hidden ${className}`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${config.bgGradient} pointer-events-none`}
        />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon size={14} className={config.color} />
            <span className="text-xs text-fg-secondary">
              {standaloneReward}
            </span>
          </div>
          <Link href={ctaLink}>
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 px-2 ${config.color} hover:bg-cream/10`}
            >
              {ctaText} <ArrowRight size={12} className="ml-1" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${config.bgGradient} border-b border-line p-3 ${className}`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift size={16} className={config.color} />
            <span className="text-sm text-fg-secondary">
              {crossPillarInvitation || standaloneReward}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href={ctaLink}>
              <Button
                size="sm"
                className="h-8 bg-cream/10 hover:bg-cream/20 text-cream border-0"
              >
                {ctaText} <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
            {onDismiss ? (
              <button
                onClick={onDismiss}
                className="text-fg-muted hover:text-cream text-xs"
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-background border border-line overflow-hidden relative ${className}`}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} pointer-events-none`}
      />
      <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 flex items-center justify-center border border-line bg-background ${config.color}`}
          >
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-xl text-cream tracking-wide mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <Gift size={12} className={config.color} />
              <span className={`text-xs font-mono ${config.color}`}>
                {standaloneReward}
              </span>
            </div>
          </div>
        </div>

        {/* Cross-pillar invitation */}
        {crossPillarInvitation ? (
          <div className="bg-background border border-line p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-fg-muted" />
              <span className=" text-fg-muted uppercase tracking-widest font-label">
                Bonus Opportunity
              </span>
            </div>
            <p className="text-sm text-fg-secondary">{crossPillarInvitation}</p>
          </div>
        ) : null}

        {/* CTA */}
        <Link href={ctaLink} className="block">
          <Button className="w-full bg-cream/10 hover:bg-cream/20 text-cream border border-line hover:border-line-strong h-10 font-mono uppercase tracking-widest text-xs">
            {ctaText} <ArrowRight size={14} className="ml-2" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

interface CrossPillarBonusPreviewProps {
  bonuses: Array<{
    source: InvitationType;
    label: string;
    value: string;
  }>;
  className?: string;
}

export function CrossPillarBonusPreview({
  bonuses,
  className = "",
}: CrossPillarBonusPreviewProps) {
  if (bonuses.length === 0) return null;

  return (
    <div className={`bg-background border border-line p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={12} className="text-primary" />
        <span className=" text-fg-muted uppercase tracking-widest font-label">
          Active Cross-Pillar Bonuses
        </span>
      </div>
      <div className="space-y-2">
        {bonuses.map((bonus, index) => {
          const config = TYPE_CONFIG[bonus.source];
          const Icon = config.icon;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={12} className={config.color} />
                <span className="text-xs text-fg-muted">{bonus.label}</span>
              </div>
              <span className={`text-xs font-mono ${config.color}`}>
                {bonus.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
