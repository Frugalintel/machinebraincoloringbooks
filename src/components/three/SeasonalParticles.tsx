'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';
import type { Season } from '@/lib/trophy-utils';

interface SeasonalParticlesProps {
  season: Season;
  particleColor: string;
  count?: number;
}

export function SeasonalParticles({ 
  season, 
  particleColor, 
  count = 100 
}: SeasonalParticlesProps) {
  const pointsRef = useRef<Points>(null);

  // Generate initial particle positions
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spread particles in a cylinder around the trophy
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.5;
      
      positions[i3] = Math.cos(angle) * radius; // x
      positions[i3 + 1] = Math.random() * 3 - 0.5; // y (height)
      positions[i3 + 2] = Math.sin(angle) * radius; // z

      // Different velocities based on season
      switch (season) {
        case 'Spring': // Rain - fast downward
          velocities[i3] = (Math.random() - 0.5) * 0.01;
          velocities[i3 + 1] = -0.03 - Math.random() * 0.02;
          velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
          break;
        case 'Summer': // Haze - slow upward drift
          velocities[i3] = (Math.random() - 0.5) * 0.005;
          velocities[i3 + 1] = 0.005 + Math.random() * 0.005;
          velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;
          break;
        case 'Fall': // Leaves - swirling downward
          velocities[i3] = (Math.random() - 0.5) * 0.02;
          velocities[i3 + 1] = -0.01 - Math.random() * 0.01;
          velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
          break;
        case 'Winter': // Snow - slow gentle drift
          velocities[i3] = (Math.random() - 0.5) * 0.008;
          velocities[i3 + 1] = -0.008 - Math.random() * 0.005;
          velocities[i3 + 2] = (Math.random() - 0.5) * 0.008;
          break;
      }
    }

    return { positions, velocities };
  }, [count, season]);

  // Animation loop
  useFrame((state) => {
    if (!pointsRef.current) return;

    const positionAttr = pointsRef.current.geometry.attributes.position;
    const posArray = positionAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Apply velocity
      posArray[i3] += velocities[i3];
      posArray[i3 + 1] += velocities[i3 + 1];
      posArray[i3 + 2] += velocities[i3 + 2];

      // Add seasonal movement variations
      switch (season) {
        case 'Fall':
          // Swirling motion for leaves
          posArray[i3] += Math.sin(time * 2 + i) * 0.003;
          posArray[i3 + 2] += Math.cos(time * 2 + i) * 0.003;
          break;
        case 'Winter':
          // Gentle side-to-side drift for snow
          posArray[i3] += Math.sin(time + i * 0.5) * 0.002;
          break;
        case 'Summer':
          // Shimmer/wobble for heat haze
          posArray[i3] += Math.sin(time * 3 + i) * 0.001;
          posArray[i3 + 2] += Math.cos(time * 3 + i) * 0.001;
          break;
      }

      // Reset particles that go out of bounds
      if (posArray[i3 + 1] < -1) {
        // Reset to top
        posArray[i3 + 1] = 2.5;
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.5 + Math.random() * 1.5;
        posArray[i3] = Math.cos(angle) * radius;
        posArray[i3 + 2] = Math.sin(angle) * radius;
      } else if (posArray[i3 + 1] > 3) {
        // Reset to bottom (for summer haze going up)
        posArray[i3 + 1] = -0.5;
      }
    }

    positionAttr.needsUpdate = true;
  });

  // Particle size based on season
  const particleSize = useMemo(() => {
    switch (season) {
      case 'Spring': return 0.02; // Small rain drops
      case 'Summer': return 0.03; // Medium haze particles
      case 'Fall': return 0.05; // Larger leaves
      case 'Winter': return 0.04; // Medium snowflakes
      default: return 0.03;
    }
  }, [season]);

  // Opacity based on season
  const opacity = useMemo(() => {
    switch (season) {
      case 'Spring': return 0.6; // Semi-transparent rain
      case 'Summer': return 0.3; // Very subtle haze
      case 'Fall': return 0.8; // Visible leaves
      case 'Winter': return 0.9; // Visible snow
      default: return 0.5;
    }
  }, [season]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={particleSize}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
