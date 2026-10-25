"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  SpotLight,
  Vector3,
  type Material,
  type Object3D,
  type Texture,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  BASIC_EMISSIVE_MAX,
  FITTED_SIZE,
  FRAME_PADDING,
  PRO_EMISSIVE_INTENSITY,
} from "@/lib/scan-ledger/trophy-frame";

export type GlbTrophyProps = {
  url: string;
  rarity?: string;
  autoRotate?: boolean;
  size?: "small" | "large";
  /** Viewport ≤760: name sits below the hero canvas. */
  compact?: boolean;
  onReady?: () => void;
  onError?: () => void;
  /** Fit the mesh to the camera box with about 12% padding. */
  fitBounds?: boolean;
};

const FADE_SECONDS = 0.25;
const ROTATION_SPEED = 0.3;

type FramePlacement = { scale: number; y: number };

function framePlacement(
  size: "small" | "large",
  compact: boolean,
): FramePlacement {
  switch (size) {
    case "small":
      return { scale: 1.75, y: -0.66 };
    case "large":
      return compact ? { scale: 1.38, y: -0.22 } : { scale: 1.5, y: -0.3 };
    default: {
      const _exhaustive: never = size;
      return _exhaustive;
    }
  }
}

const RARITY_RIM: Record<string, string> = {
  Common: "#757269",
  Uncommon: "#979288",
  Rare: "#B9B3A6",
  Epic: "#D0C9BA",
  Legendary: "#F2EAD8",
};

const TEXTURE_KEYS = [
  "map",
  "normalMap",
  "metalnessMap",
  "roughnessMap",
  "aoMap",
  "emissiveMap",
  "bumpMap",
] as const;

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function disposeMaterial(material: Material) {
  const seen = new Set<Texture>();
  const record = material as MeshStandardMaterial & Record<string, unknown>;
  for (const key of TEXTURE_KEYS) {
    const tex = record[key];
    if (tex && typeof tex === "object" && "dispose" in tex) {
      const texture = tex as Texture;
      if (!seen.has(texture)) {
        seen.add(texture);
        texture.dispose();
      }
    }
  }
  material.dispose();
}

function disposeObject(root: Object3D) {
  root.traverse((object) => {
    if (!isMesh(object)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (material) disposeMaterial(material);
    }
  });
}

function meshMaterials(object: Mesh): Material[] {
  return Array.isArray(object.material) ? object.material : [object.material];
}

function applyTierLook(root: Object3D, rarity: string) {
  root.traverse((object) => {
    if (!isMesh(object)) return;
    for (const material of meshMaterials(object)) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      switch (rarity) {
        case "Basic":
        case "Common":
          material.color.offsetHSL(-0.04, -0.12, -0.2);
          material.roughness = Math.max(material.roughness, 0.7);
          material.metalness = Math.min(material.metalness, 0.4);
          material.emissiveIntensity = Math.min(
            material.emissiveIntensity,
            BASIC_EMISSIVE_MAX,
          );
          break;
        case "Pro":
        case "Uncommon":
          material.metalness = Math.max(material.metalness, 0.82);
          material.roughness = Math.min(material.roughness, 0.28);
          material.emissive.set("#e8e2d4");
          material.emissiveIntensity = PRO_EMISSIVE_INTENSITY;
          break;
        default:
          break;
      }
    }
  });
}

function fitRootToBounds(root: Object3D, padding = 0.12) {
  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const scale = (1 - padding) / maxDim;
  root.position.sub(center);
  root.scale.multiplyScalar(scale);
}

function prepareScene(root: Object3D) {
  root.traverse((object) => {
    if (!isMesh(object)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    for (const material of meshMaterials(object)) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      if (material.metalnessMap && !material.aoMap) {
        material.aoMap = material.metalnessMap;
        material.aoMapIntensity = 0.85;
        material.needsUpdate = true;
      }
    }
  });
}

function setObjectOpacity(root: Object3D, opacity: number) {
  root.traverse((object) => {
    if (!isMesh(object)) return;
    for (const material of meshMaterials(object)) {
      if (!material) continue;
      material.transparent = opacity < 1;
      material.opacity = opacity;
    }
  });
}

function KeySpot({ targetY = 0.45 }: { targetY?: number }) {
  const ref = useRef<SpotLight>(null);
  const { scene } = useThree();

  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.target.position.set(0, targetY, 0);
    scene.add(light.target);
    return () => {
      scene.remove(light.target);
    };
  }, [scene, targetY]);

  return (
    <spotLight
      ref={ref}
      color={0xffeed1}
      intensity={28}
      distance={8}
      angle={0.33}
      penumbra={0.5}
      decay={2}
      position={[0.15, 2.75, 0.4]}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-bias={-0.0002}
    />
  );
}

function RoomEnv() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const room = new RoomEnvironment();
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(room, 0.04).texture;
    const previous = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    scene.environment = env;
    scene.environmentIntensity = 0.25;
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = previousIntensity;
      env.dispose();
      pmrem.dispose();
      room.dispose();
    };
  }, [gl, scene]);

  return null;
}

/**
 * Studio Ferris-wheel sample. Entropy and polish are skipped: they tint
 * placeholder materials, and rewriting this model's PBR maps is not trivial.
 */
export function GlbTrophy({
  url,
  rarity = "Common",
  autoRotate = true,
  size = "small",
  compact = false,
  onReady,
  onError,
  fitBounds = false,
}: GlbTrophyProps) {
  const groupRef = useRef<Group>(null);
  const fadeRef = useRef(0);
  const [model, setModel] = useState<Group | null>(null);
  const rimColor = RARITY_RIM[rarity] ?? RARITY_RIM.Common;
  const frame = framePlacement(size, compact);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    void loader
      .loadAsync(url)
      .then((gltf) => {
        if (cancelled) {
          disposeObject(gltf.scene);
          return;
        }
        prepareScene(gltf.scene);
        applyTierLook(gltf.scene, rarity);
        if (fitBounds) fitRootToBounds(gltf.scene, FRAME_PADDING);
        setObjectOpacity(gltf.scene, 0);
        setModel(gltf.scene);
        onReady?.();
      })
      .catch(() => {
        if (!cancelled) onError?.();
      });

    return () => {
      cancelled = true;
    };
  }, [url, rarity, fitBounds, onReady, onError]);

  useEffect(() => {
    fadeRef.current = 0;
    if (model) setObjectOpacity(model, 0);
    return () => {
      if (model) disposeObject(model);
    };
  }, [model]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * ROTATION_SPEED;
    }
    if (!model || fadeRef.current >= 1) return;
    fadeRef.current = Math.min(1, fadeRef.current + delta / FADE_SECONDS);
    setObjectOpacity(model, fadeRef.current);
  });

  if (!model) return null;

  return (
    <>
      <RoomEnv />
      <KeySpot targetY={fitBounds ? 0 : 0.45} />
      <directionalLight
        color={0xccdfff}
        intensity={1.2}
        position={[-1.2, 1.5, -1.7]}
      />
      <directionalLight
        color={0xffe6cc}
        intensity={0.6}
        position={[1.4, 1.1, -1.5]}
      />
      <directionalLight
        color={rimColor}
        intensity={0.35}
        position={[0.35, 0.9, -1.9]}
      />
      {size === "large" ? (
        <mesh
          rotation-x={-Math.PI / 2}
          position={[0, fitBounds ? -FITTED_SIZE / 2 : frame.y, 0]}
          receiveShadow
        >
          <planeGeometry args={[3, 3]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
      ) : null}
      <group
        ref={groupRef}
        scale={fitBounds ? 1 : frame.scale}
        position={fitBounds ? [0, 0, 0] : [0, frame.y, 0]}
      >
        <primitive object={model} />
      </group>
    </>
  );
}
