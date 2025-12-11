import { 
    Trophy, Medal, Crown, Star, Gem, Zap, Rocket, Sword, Shield, Map, Brush, Code, Lock, Heart, Smile, Terminal 
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
    'trophy': Trophy,
    'medal': Medal,
    'crown': Crown,
    'star': Star,
    'gem': Gem,
    'zap': Zap,
    'rocket': Rocket,
    'sword': Sword,
    'shield': Shield,
    'map': Map,
    'brush': Brush,
    'code': Code,
    'lock': Lock,
    'heart': Heart,
    'smile': Smile,
    'terminal': Terminal,
};

export const getIconComponent = (iconName: string) => {
    const Icon = ICON_MAP[iconName.toLowerCase()] || Trophy;
    return Icon;
};

export const getRarityStyles = (rarity?: string) => {
    switch(rarity?.toLowerCase()) {
        case 'legendary': return {
            border: 'border-orange-500/60 hover:border-orange-400',
            glow: 'shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_-5px_rgba(249,115,22,0.6)]',
            icon: 'bg-orange-500/30 text-orange-400 border-orange-500/60',
            text: 'text-orange-400',
            bg: 'bg-gradient-to-br from-orange-950/50 via-[#111] to-yellow-950/30',
            accent: 'bg-gradient-to-b from-orange-500 to-yellow-500',
            titleColor: 'text-orange-100',
            progressColor: 'from-orange-500 to-yellow-500'
        };
        case 'epic': return {
            border: 'border-purple-500/60 hover:border-purple-400',
            glow: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.6)]',
            icon: 'bg-purple-500/30 text-purple-400 border-purple-500/60',
            text: 'text-purple-400',
            bg: 'bg-gradient-to-br from-purple-950/50 via-[#111] to-pink-950/30',
            accent: 'bg-gradient-to-b from-purple-500 to-pink-500',
            titleColor: 'text-purple-100',
            progressColor: 'from-purple-500 to-pink-500'
        };
        case 'rare': return {
            border: 'border-blue-500/60 hover:border-blue-400',
            glow: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.6)]',
            icon: 'bg-blue-500/30 text-blue-400 border-blue-500/60',
            text: 'text-blue-400',
            bg: 'bg-gradient-to-br from-blue-950/50 via-[#111] to-cyan-950/30',
            accent: 'bg-gradient-to-b from-blue-500 to-cyan-500',
            titleColor: 'text-blue-100',
            progressColor: 'from-blue-500 to-cyan-500'
        };
        case 'uncommon': return {
            border: 'border-green-500/60 hover:border-green-400',
            glow: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_-5px_rgba(34,197,94,0.6)]',
            icon: 'bg-green-500/30 text-green-400 border-green-500/60',
            text: 'text-green-400',
            bg: 'bg-gradient-to-br from-green-950/50 via-[#111] to-emerald-950/30',
            accent: 'bg-gradient-to-b from-green-500 to-emerald-500',
            titleColor: 'text-green-100',
            progressColor: 'from-green-500 to-emerald-500'
        };
        default: return {
            border: 'border-[#333] hover:border-gray-500',
            glow: 'hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]',
            icon: 'bg-[#222] text-gray-400 border-[#444]',
            text: 'text-gray-400',
            bg: 'bg-[#111]',
            accent: 'bg-gray-600',
            titleColor: 'text-white',
            progressColor: 'from-gray-500 to-gray-400'
        };
    }
};

export const getAchievementProgress = (progressStr?: string): number => {
    if (!progressStr) return 0;
    const match = progressStr.match(/(\d+)\/(\d+)/);
    if (match) {
        return Math.min(100, Math.max(0, (parseInt(match[1]) / parseInt(match[2])) * 100));
    }
    return 0;
};

