import React from 'react';
import { getIconComponent } from '@/lib/achievement-utils';

interface AchievementIconProps {
    icon: string;
    size?: number;
    className?: string;
}

export function AchievementIcon({ icon, size = 20, className = "" }: AchievementIconProps) {
    const IconComponent = getIconComponent(icon);
    return <IconComponent size={size} className={className} />;
}

