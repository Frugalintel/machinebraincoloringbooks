"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  SpotLight,
  type Material,
  type Object3D,
  type Texture,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type GlbTrophyProps = {
  url: string;
  rarity?: string;
  autoRotate?: boolean;
  size?: "small" | "large";
  onReady?: () => void;
  onError?: () => void;
};

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

function prepareScene(root: Object3D) {
  root.traverse((object) => {
    if (!isMesh(object)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      if (material.metalnessMap && !material.aoMap) {
        material.aoMap = material.metalnessMap;
        material.aoMapIntensity = 0.85;
        material.needsUpdate = true;
      }
    }
  });
}

function KeySpot() {
  const ref = useRef<SpotLight>(null);
  const { scene } = useThree();

  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.target.position.set(0, 0.45, 0);
    scene.add(light.target);
    return () => {
      scene.remove(light.target);
    };
  }, [scene]);

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
  onReady,
  onError,
}: GlbTrophyProps) {
  const groupRef = useRef<Group>(null);
  const [model, setModel] = useState<Group | null>(null);
  const rimColor = RARITY_RIM[rarity] ?? RARITY_RIM.Common;
  const frameScale = size === "small" ? 1.45 : 1.38;

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
        setModel(gltf.scene);
        onReady?.();
      })
      .catch(() => {
        if (!cancelled) onError?.();
      });

    return () => {
      cancelled = true;
    };
  }, [url, onReady, onError]);

  useEffect(() => {
    return () => {
      if (model) disposeObject(model);
    };
  }, [model]);

  useFrame(() => {
    if (!groupRef.current || !autoRotate) return;
    groupRef.current.rotation.y += 0.005;
  });

  if (!model) return null;

  return (
    <>
      <RoomEnv />
      <KeySpot />
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
      <group ref={groupRef} scale={frameScale}>
        <primitive object={model} />
      </group>
    </>
  );
}
