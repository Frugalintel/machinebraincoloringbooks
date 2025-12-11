import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRarityStyles, getAchievementProgress } from '@/lib/achievement-utils';
import { Achievement } from '@/lib/game-data';
import { AchievementIcon } from './achievement-icon';

// Extended Achievement interface to include optional rarity/custom properties
interface ExtendedAchievement extends Achievement {
    rarity?: string;
    custom_color?: string;
    trigger_type?: string;
    target_value?: number;
    is_secret?: boolean;
}

interface AchievementCardProps {
    achievement: ExtendedAchievement;
    variant?: 'profile' | 'grid' | 'compact' | 'modal';
    isActive?: boolean;
    isFull?: boolean;
    onToggle?: (id: string) => void;
    onSwap?: (id: string) => void;
    onViewCollectible?: () => void;
    relatedCollectible?: { name: string; image: string };
}

export function AchievementCard({
    achievement,
    variant = 'grid',
    isActive = false,
    isFull = false,
    onToggle,
    onSwap,
    onViewCollectible,
    relatedCollectible
}: AchievementCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const isCompleted = achievement.unlocked;
    const styles = getRarityStyles(achievement.rarity);
    const progressPercent = getAchievementProgress(achievement.progress);

    // Common card container classes that mimic the admin page
    const cardClasses = `group relative border rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        isCompleted ? styles.bg : 'bg-[#0a0a0a]'
    } ${
        isCompleted ? styles.border : isActive ? styles.border + ' shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-[#333] hover:border-gray-600'
    } ${
        isCompleted ? styles.glow : ''
    }`;

    // Compact/Modal Variant (Used in Swap Modal)
    if (variant === 'modal') {
        return (
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onToggle && onToggle(achievement.id)}
                className="w-full p-4 border border-[#333] bg-[#151515] hover:border-red-500/50 hover:bg-red-900/10 transition-all flex items-center gap-4 group text-left rounded-xl"
            >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${styles.icon} bg-opacity-20`}>
                    <AchievementIcon icon={achievement.icon} size={20} />
                </div>
                <div className="flex-1">
                    <h4 className={`font-heading font-bold text-sm mb-0.5 ${isCompleted ? styles.titleColor : 'text-white'}`}>
                        {achievement.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono uppercase">{achievement.progress || "In Progress"}</p>
                </div>
                <div className="text-[10px] text-gray-600 group-hover:text-red-500 font-mono uppercase tracking-widest transition-colors">
                    Remove
                </div>
            </motion.button>
        );
    }

    // Universal Card Design (Matches Admin Style)
    return (
        <div 
            id={achievement.id}
            className={cardClasses}
            onClick={() => variant === 'profile' && setIsExpanded(!isExpanded)}
        >
            {/* Completed Background Pattern - Uses Rarity Color now */}
            {isCompleted ? <div className="absolute inset-0 opacity-[0.15] pointer-events-none" 
                     style={{ 
                         backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)`,
                     }}>
                </div> : null}

            {/* Colored Accent Bar (Top) */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
                isCompleted ? styles.accent : isActive ? styles.accent : 'bg-transparent'
            }`}></div>

            <div className="block h-full p-4 pt-5 pb-14 relative z-10">
                <div className="flex items-start gap-4">
                    {/* Compact Icon Box */}
                    <div className={`w-14 h-14 rounded-xl flex shrink-0 items-center justify-center border-2 transition-colors ${
                        isCompleted 
                            ? styles.icon 
                            : isActive 
                                ? styles.icon
                                : 'border-[#333] text-gray-600 bg-[#111]'
                    }`}>
                        <AchievementIcon icon={achievement.icon} size={24} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                        <h3 className={`font-heading font-bold text-sm mb-0.5 truncate pr-6 ${
                            isCompleted ? styles.titleColor : isActive ? 'text-white' : 'text-gray-400'
                        }`}>
                            {achievement.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-1">
                            {/* Rarity Badge - Minimalist */}
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 ${
                                isCompleted ? styles.text : 'text-gray-500'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? styles.bg.replace('bg-gradient-to-br', 'bg') : 'bg-gray-600'}`}></span>
                                {achievement.rarity || 'Common'}
                            </span>

                            {/* Status Badge - Solid/Distinct */}
                            {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20 shadow-sm backdrop-blur-sm">
                                    <CheckCircle size={10} fill="currentColor" className="text-green-500" />
                                    Complete
                                </span>
                            ) : isActive ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary text-black shadow-[0_0_10px_rgba(255,79,0,0.4)] animate-pulse">
                                    <Zap size={10} fill="currentColor" className="text-black" />
                                    Active
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {achievement.is_secret && !isCompleted ? <div className="absolute top-5 right-4">
                            <span title="Secret"><Lock size={12} className="text-gray-600" /></span>
                        </div> : null}
                </div>

                <p className={`text-xs line-clamp-2 mt-3 min-h-[2.5em] ${
                    isCompleted || isActive ? 'text-gray-300' : 'text-gray-600'
                }`}>
                    {achievement.description}
                </p>

                {/* Progress / Target Section */}
                <div className="pt-3 border-t border-white/5 mt-3">
                    {!isCompleted && achievement.progress ? (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono uppercase">
                                <span className="text-gray-500">Progress</span>
                                <span className={isActive ? 'text-primary' : 'text-gray-500'}>{achievement.progress}</span>
                            </div>
                            <div className="h-1 bg-[#222] w-full rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className={`h-full ${isActive ? 'bg-primary' : 'bg-gray-600'}`}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-mono uppercase">
                                {isCompleted ? "Unlocked" : "Target"}
                            </span>
                            <span className={`text-xs font-bold font-mono ${isCompleted ? styles.text : 'text-gray-500'}`}>
                                {isCompleted ? (achievement.date || "Completed") : (achievement.target_value || "Locked")}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions Footer - Fixed at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/20 border-t border-white/5 p-2 flex justify-between items-center backdrop-blur-sm">
                {relatedCollectible ? (
                    <div className="flex items-center gap-2 px-2" onClick={onViewCollectible}>
                        <div className={`w-4 h-4 rounded-full ${relatedCollectible.image} opacity-70`}></div>
                        <span className="text-[9px] font-mono text-gray-400 uppercase truncate max-w-[100px]">{relatedCollectible.name}</span>
                    </div>
                ) : <div></div>}

                {!isCompleted && onToggle ? <Button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(achievement.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className={`h-8 text-[9px] uppercase tracking-widest font-bold hover:bg-transparent ${
                            isActive 
                                ? "text-red-500 hover:text-red-400" 
                                : isFull 
                                    ? "text-amber-500 hover:text-amber-400"
                                    : "text-primary hover:text-white"
                        }`}
                    >
                        {isActive ? "Deactivate" : (isFull ? "Swap" : "Activate")}
                    </Button> : null}
                
                {isCompleted ? <div className="flex items-center gap-1 px-3 py-1 text-[9px] uppercase tracking-widest text-green-500 font-mono">
                         <CheckCircle size={10} /> Done
                     </div> : null}
            </div>
        </div>
    );
}

