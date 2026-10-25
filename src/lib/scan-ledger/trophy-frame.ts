/** Shared 12% frame padding for fitted trophies and their still posters. */
export const FRAME_PADDING = 0.12;

/** Fitted mesh max dimension after `fitRootToBounds(root, FRAME_PADDING)`. */
export const FITTED_SIZE = 1 - FRAME_PADDING;

export const FITTED_LOOK_AT: [number, number, number] = [0, 0, 0];

/** Pro/Uncommon fill. High emissive washes silver into a cream silhouette. */
export const PRO_EMISSIVE_INTENSITY = 0.05;

export const BASIC_EMISSIVE_MAX = 0.04;

export function fittedCameraDistance(
  fovDeg: number,
  fittedSize = FITTED_SIZE,
  padding = FRAME_PADDING,
): number {
  const visible = fittedSize / (1 - padding);
  return visible / 2 / Math.tan((fovDeg * Math.PI) / 360);
}

export function fittedCameraPosition(fovDeg: number): [number, number, number] {
  return [0, 0, fittedCameraDistance(fovDeg)];
}
