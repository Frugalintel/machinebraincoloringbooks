import type { Stamp } from "@/lib/collectibles-view";

/**
 * Dev-only reader for screenshots. Real catalog ids, not sample JSON.
 * Production passes allowFixture false and this map is never applied.
 */
export const COLLECTIBLES_FIXTURE_OWNED: Record<string, string> = {
  "rover-x": "2026-10-02T12:00:00.000Z",
  "cyber-spaniel": "2026-10-09T12:00:00.000Z",
  "atomic-poodle": "2026-10-21T12:00:00.000Z",
  "alpha-wing": "2026-10-14T12:00:00.000Z",
  "omega-station": "2026-10-16T12:00:00.000Z",
};

export type CollectiblesPreview = "some" | "none" | "out";

export function collectiblesPreview(
  allowFixture: boolean,
  value: string | null,
): CollectiblesPreview | null {
  if (!allowFixture) return null;
  if (value === "some" || value === "none" || value === "out") return value;
  return null;
}

export function fixtureStamps(): Record<string, Stamp> {
  const stamps: Record<string, Stamp> = {};
  for (const [id, unlockedAt] of Object.entries(COLLECTIBLES_FIXTURE_OWNED)) {
    stamps[id] = { unlockedAt };
  }
  return stamps;
}

export function fixtureCollectedIds(): Set<string> {
  return new Set(Object.keys(COLLECTIBLES_FIXTURE_OWNED));
}
