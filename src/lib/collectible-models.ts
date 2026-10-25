/**
 * Optional per-item GLB for the collectible vitrine.
 * Only omega-station has a Studio sample model; every other item stays
 * on the procedural TrophyModel placeholder.
 */
export const FERRIS_WHEEL_MODEL_URL = "/models/ferris-wheel-tripo.v1.glb";

const COLLECTIBLE_MODEL_URLS: Readonly<Record<string, string>> = {
  "omega-station": FERRIS_WHEEL_MODEL_URL,
};

export function collectibleModelUrl(id: string): string | undefined {
  return COLLECTIBLE_MODEL_URLS[id];
}
