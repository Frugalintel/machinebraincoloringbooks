"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  X,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { GateCheckResultUI } from "@/lib/types";

interface SoftGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateResult: GateCheckResultUI;
  onSkipWithXP?: () => void;
  storyTitle?: string;
  nodeTitle?: string;
}

export function SoftGateModal({
  isOpen,
  onClose,
  gateResult,
  onSkipWithXP,
  storyTitle,
  nodeTitle,
}: SoftGateModalProps) {
  const { hasRequirement, bypassOptions } = gateResult;

  // If user has the requirement, don't show modal
  if (hasRequirement) return null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#0a0a0a] border border-[#333] w-full max-w-md relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background texture */}
            <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

            {/* Header */}
            <div className="border-b border-[#333] p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-amber-500 text-[10px] font-mono uppercase tracking-widest mb-2">
                    <Lock size={12} /> Gate Encountered
                  </div>
                  <h3 className="font-heading text-xl text-white uppercase">
                    {nodeTitle || "Locked Content"}
                  </h3>
                  {storyTitle ? (
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {storyTitle}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center border border-[#333] text-gray-500 hover:text-white hover:border-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Requirement Info */}
            <div className="p-6 border-b border-[#333]">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest mb-3">
                <AlertTriangle size={12} className="text-amber-500" />
                <span>Requirement Not Met</span>
              </div>
              {gateResult.requirementLabel ? (
                <div className="bg-[#111] border border-[#222] p-4">
                  <p className="text-sm text-gray-300">
                    {gateResult.requirementLabel}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Bypass Options */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                <Sparkles size={12} className="text-primary" />
                <span>Available Options</span>
              </div>

              {/* Skip with XP */}
              {bypassOptions?.xpCost !== undefined && onSkipWithXP ? (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onSkipWithXP}
                  disabled={!bypassOptions.canAfford}
                  className={`w-full p-4 border transition-all flex items-center gap-4 text-left
                    ${
                      bypassOptions.canAfford
                        ? "border-[#333] bg-[#111] hover:border-primary/50 hover:bg-[#1a1a1a]"
                        : "border-[#222] bg-[#0a0a0a] opacity-50 cursor-not-allowed"
                    }
                  `}
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center border ${bypassOptions.canAfford ? "border-primary/50 text-primary" : "border-[#333] text-gray-600"}`}
                  >
                    <Unlock size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading text-white uppercase">
                      Skip with XP
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono uppercase">
                      Cost: {bypassOptions.xpCost} XP
                    </p>
                  </div>
                  {bypassOptions.canAfford ? (
                    <span className="text-[10px] text-primary font-mono uppercase tracking-widest">
                      Available
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-500 font-mono uppercase tracking-widest">
                      Not Enough XP
                    </span>
                  )}
                </motion.button>
              ) : null}

              {/* Alternatives */}
              {bypassOptions?.alternatives &&
              bypassOptions.alternatives.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                    Or earn the requirement:
                  </p>
                  {bypassOptions.alternatives.map((alt, index) => (
                    <Link key={index} href={alt.link} className="block">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="w-full p-3 border border-[#333] bg-[#111] hover:border-[#444] transition-all flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-mono">
                            {alt.type}
                          </span>
                          <p className="text-sm text-gray-300">{alt.label}</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-600" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-[#333] p-4 bg-[#111]">
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-[#333] text-gray-500 hover:text-white hover:border-white rounded-none h-10 text-[10px] uppercase tracking-widest"
              >
                Continue Later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface GateIndicatorProps {
  hasRequirement: boolean;
  requirementLabel?: string;
  bypassCost?: number;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}

export function GateIndicator({
  hasRequirement,
  requirementLabel: _requirementLabel,
  bypassCost,
  size = "sm",
  onClick,
  className = "",
}: GateIndicatorProps) {
  const sizeClasses = {
    sm: "text-[9px] px-2 py-1",
    md: "text-[10px] px-3 py-1.5",
  };

  if (hasRequirement) {
    return (
      <div
        className={`inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-500 ${sizeClasses[size]} font-mono uppercase tracking-widest ${className}`}
      >
        <Unlock size={size === "sm" ? 10 : 12} />
        <span>Unlocked</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 ${sizeClasses[size]} font-mono uppercase tracking-widest hover:bg-amber-500/20 transition-colors ${className}`}
    >
      <Lock size={size === "sm" ? 10 : 12} />
      <span>{bypassCost ? `${bypassCost} XP` : "Gate"}</span>
    </button>
  );
}
