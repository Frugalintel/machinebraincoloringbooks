'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Color } from 'three';
import type { Season } from '@/lib/trophy-utils';
import { getSeasonalModifier } from '@/lib/trophy-utils';

interface TrophyModelProps {
  rarity?: string;
  autoRotate?: boolean;
  entropy?: number; // 0-1, how aged/dusty the trophy is
  season?: Season; // Current season for visual effects
}

// Rarity color mapping (matches existing rarityColors in collectibles page)
const RARITY_COLORS: Record<string, { main: string; emissive: string; intensity: number }> = {
  Common: { main: '#9ca3af', emissive: '#6b7280', intensity: 0.1 },
  Uncommon: { main: '#4ade80', emissive: '#22c55e', intensity: 0.2 },
  Rare: { main: '#60a5fa', emissive: '#3b82f6', intensity: 0.3 },
  Epic: { main: '#c084fc', emissive: '#a855f7', intensity: 0.4 },
  Legendary: { main: '#fb923c', emissive: '#f97316', intensity: 0.5 },
};

const DEFAULT_COLORS = { main: '#9ca3af', emissive: '#6b7280', intensity: 0.1 };

// Dust/corrosion color for entropy
const DUST_COLOR = new Color('#8B5A2B'); // Saddle brown

/**
 * Apply entropy and seasonal effects to a base color
 */
function applyEffectsToColor(
  baseColor: string,
  entropy: number,
  seasonTint: [number, number, number]
): Color {
  const color = new Color(baseColor);
  
  // Apply seasonal tint
  color.r *= seasonTint[0];
  color.g *= seasonTint[1];
  color.b *= seasonTint[2];
  
  // Apply entropy (dust/corrosion) - lerp towards dust color
  if (entropy > 0) {
    color.lerp(DUST_COLOR, entropy * 0.35);
  }
  
  return color;
}

export function TrophyModel({ 
  rarity = 'Common', 
  autoRotate = true,
  entropy = 0,
  season = 'Summer',
}: TrophyModelProps) {
  const groupRef = useRef<Group>(null);
  const gemRef = useRef<Mesh>(null);

  // Get base colors with fallback
  const baseColors = RARITY_COLORS[rarity] || DEFAULT_COLORS;
  
  // Get seasonal modifier
  const seasonMod = getSeasonalModifier(season);

  // Calculate modified colors based on entropy and season
  const modifiedColors = useMemo(() => {
    const mainColor = applyEffectsToColor(baseColors.main, entropy, seasonMod.tint);
    const emissiveColor = applyEffectsToColor(baseColors.emissive, entropy, seasonMod.tint);
    
    // Entropy dims the glow, season adjusts intensity
    const intensityMod = (1 - entropy * 0.4) * seasonMod.intensity;
    
    return {
      main: mainColor,
      emissive: emissiveColor,
      intensity: baseColors.intensity * intensityMod,
    };
  }, [baseColors, entropy, seasonMod]);

  // Entropy increases roughness (dusty/corroded surfaces are rougher)
  const roughnessModifier = entropy * 0.6;
  
  // Entropy decreases metalness slightly (corrosion dulls metal)
  const metalnessModifier = entropy * 0.2;

  // Animation loop for rotation and floating effect
  useFrame((state) => {
    if (!groupRef.current) return;

    // Auto rotation (slightly slower when corroded)
    if (autoRotate) {
      const rotationSpeed = 0.005 * (1 - entropy * 0.3);
      groupRef.current.rotation.y += rotationSpeed;
    }

    // Floating effect for the gem (less pronounced when aged)
    if (gemRef.current) {
      const floatAmplitude = 0.1 * (1 - entropy * 0.5);
      gemRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 2) * floatAmplitude;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base pedestal - cylinder */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.3, 32]} />
        <meshStandardMaterial
          color={applyEffectsToColor('#1a1a1a', entropy * 0.5, seasonMod.tint)}
          metalness={Math.max(0.8 - metalnessModifier, 0.3)}
          roughness={Math.min(0.2 + roughnessModifier * 0.5, 0.8)}
        />
      </mesh>

      {/* Mid pedestal ring */}
      <mesh position={[0, -0.25, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.2, 32]} />
        <meshStandardMaterial
          color={applyEffectsToColor('#222222', entropy * 0.5, seasonMod.tint)}
          metalness={Math.max(0.9 - metalnessModifier, 0.4)}
          roughness={Math.min(0.1 + roughnessModifier * 0.5, 0.7)}
        />
      </mesh>

      {/* Stem */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 0.5, 16]} />
        <meshStandardMaterial
          color={modifiedColors.main}
          metalness={Math.max(0.7 - metalnessModifier, 0.3)}
          roughness={Math.min(0.3 + roughnessModifier, 0.9)}
          emissive={modifiedColors.emissive}
          emissiveIntensity={modifiedColors.intensity * 0.5}
        />
      </mesh>

      {/* Main gem/trophy body - dodecahedron */}
      <mesh ref={gemRef} position={[0, 0.8, 0]} castShadow>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={modifiedColors.main}
          metalness={Math.max(0.3 - metalnessModifier * 0.5, 0.1)}
          roughness={Math.min(0.1 + roughnessModifier, 0.7)}
          emissive={modifiedColors.emissive}
          emissiveIntensity={modifiedColors.intensity}
          transparent
          opacity={Math.max(0.9 - entropy * 0.2, 0.6)}
        />
      </mesh>

      {/* Inner glow core */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={modifiedColors.emissive}
          emissive={modifiedColors.emissive}
          emissiveIntensity={modifiedColors.intensity * 2}
          transparent
          opacity={Math.max(0.6 - entropy * 0.3, 0.2)}
        />
      </mesh>

      {/* Accent ring around gem */}
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.02, 16, 32]} />
        <meshStandardMaterial
          color={modifiedColors.main}
          metalness={Math.max(0.9 - metalnessModifier, 0.4)}
          roughness={Math.min(0.1 + roughnessModifier, 0.6)}
          emissive={modifiedColors.emissive}
          emissiveIntensity={modifiedColors.intensity * 0.3}
        />
      </mesh>

      {/* Dust particles overlay (only visible at higher entropy) */}
      {entropy > 0.3 && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshStandardMaterial
            color="#8B7355"
            transparent
            opacity={entropy * 0.15}
            roughness={1}
            metalness={0}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
