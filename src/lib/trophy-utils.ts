import { differenceInMonths, isWithinInterval } from 'date-fns';

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';

export interface SeasonalModifier {
  tint: [number, number, number]; // RGB multipliers
  particleType: 'rain' | 'haze' | 'leaves' | 'snow';
  particleColor: string;
  intensity: number; // Brightness modifier
}

/**
 * Calculate trophy entropy (0-1) based on time since unlock or last polish.
 * Caps at 6 months for full entropy.
 * @param unlockedAt - ISO date string when trophy was unlocked
 * @param lastPolishedAt - Optional ISO date string when trophy was last polished
 * @returns Entropy factor from 0 (pristine) to 1 (fully aged)
 */
export function getTrophyEntropy(
  unlockedAt?: string,
  lastPolishedAt?: string
): number {
  if (!unlockedAt) return 0;

  // Use the more recent date between unlock and last polish
  const effectiveDate = lastPolishedAt
    ? new Date(Math.max(new Date(lastPolishedAt).getTime(), new Date(unlockedAt).getTime()))
    : new Date(unlockedAt);

  const months = differenceInMonths(new Date(), effectiveDate);
  
  // Cap at 6 months for full entropy (1.0)
  return Math.min(Math.max(months / 6, 0), 1);
}

/**
 * Get the current season based on Midwest US dates.
 * Uses astronomical season boundaries (equinoxes and solstices).
 * 
 * - Spring: March 20 - June 20
 * - Summer: June 21 - September 22
 * - Fall: September 23 - December 21
 * - Winter: December 22 - March 19
 * 
 * @param date - Optional date to check (defaults to now)
 * @returns Current season
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Spring: Mar 20 - Jun 20
  if (
    (month === 2 && day >= 20) || // March 20+
    month === 3 || // April
    month === 4 || // May
    (month === 5 && day <= 20) // June 1-20
  ) {
    return 'Spring';
  }

  // Summer: Jun 21 - Sep 22
  if (
    (month === 5 && day >= 21) || // June 21+
    month === 6 || // July
    month === 7 || // August
    (month === 8 && day <= 22) // September 1-22
  ) {
    return 'Summer';
  }

  // Fall: Sep 23 - Dec 21
  if (
    (month === 8 && day >= 23) || // September 23+
    month === 9 || // October
    month === 10 || // November
    (month === 11 && day <= 21) // December 1-21
  ) {
    return 'Fall';
  }

  // Winter: Dec 22 - Mar 19
  return 'Winter';
}

/**
 * Get visual modifiers for a given season.
 * @param season - The season to get modifiers for
 * @returns SeasonalModifier with tint, particle type, and intensity
 */
export function getSeasonalModifier(season: Season): SeasonalModifier {
  const modifiers: Record<Season, SeasonalModifier> = {
    Spring: {
      tint: [0.9, 1.0, 0.95], // Slight fresh green tint
      particleType: 'rain',
      particleColor: '#87CEEB', // Light blue
      intensity: 1.1, // Slightly brighter (fresh)
    },
    Summer: {
      tint: [1.0, 0.95, 0.85], // Warm yellow/orange tint
      particleType: 'haze',
      particleColor: '#FFD700', // Gold
      intensity: 1.15, // Brightest (sun)
    },
    Fall: {
      tint: [1.0, 0.85, 0.7], // Orange/brown tint
      particleType: 'leaves',
      particleColor: '#CD853F', // Peru (autumn brown)
      intensity: 0.9, // Slightly dimmer
    },
    Winter: {
      tint: [0.9, 0.95, 1.0], // Cool blue tint
      particleType: 'snow',
      particleColor: '#FFFFFF', // White
      intensity: 0.85, // Dimmer (cold)
    },
  };

  return modifiers[season];
}

/**
 * Apply entropy effects to base color.
 * Higher entropy = more brown/dusty appearance.
 * @param baseColor - Hex color string
 * @param entropy - Entropy factor 0-1
 * @returns Modified hex color
 */
export function applyEntropyToColor(baseColor: string, entropy: number): string {
  // Parse hex color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Dust/brown tint: shift towards brownish gray
  const dustR = 139; // Saddle brown
  const dustG = 90;
  const dustB = 43;

  // Interpolate towards dust color based on entropy
  const newR = Math.round(r + (dustR - r) * entropy * 0.3);
  const newG = Math.round(g + (dustG - g) * entropy * 0.3);
  const newB = Math.round(b + (dustB - b) * entropy * 0.3);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Get entropy level description for UI display.
 * @param entropy - Entropy factor 0-1
 * @returns Human-readable description
 */
export function getEntropyDescription(entropy: number): string {
  if (entropy < 0.1) return 'Pristine';
  if (entropy < 0.25) return 'Light Dust';
  if (entropy < 0.5) return 'Dusty';
  if (entropy < 0.75) return 'Weathered';
  return 'Corroded';
}

/**
 * Get season display info for UI.
 * @param season - Current season
 * @returns Object with display name and effect description
 */
export function getSeasonDisplayInfo(season: Season): { name: string; effect: string } {
  const info: Record<Season, { name: string; effect: string }> = {
    Spring: { name: 'Spring', effect: 'Rain Mist' },
    Summer: { name: 'Summer', effect: 'Heat Shimmer' },
    Fall: { name: 'Fall', effect: 'Falling Leaves' },
    Winter: { name: 'Winter', effect: 'Snowfall' },
  };
  return info[season];
}
