import { findCollectibleById } from "@/lib/game-data";

/**
 * Prod collectibles.id → catalog slug. Matches the 9 backfilled rows.
 * Used so a stored uuid still counts as owned against game-data.ts ids.
 */
export const COLLECTIBLE_UUID_TO_SLUG: Record<string, string> = {
  "30000000-0000-0000-0000-000000000001": "rover-x",
  "30000000-0000-0000-0000-000000000002": "cyber-spaniel",
  "30000000-0000-0000-0000-000000000003": "atomic-poodle",
  "30000000-0000-0000-0000-000000000004": "quantum-bulldog",
  "30000000-0000-0000-0000-000000000005": "alpha-wing",
  "30000000-0000-0000-0000-000000000006": "beta-destroyer",
  "30000000-0000-0000-0000-000000000007": "gamma-scout",
  "30000000-0000-0000-0000-000000000008": "delta-cruiser",
  "30000000-0000-0000-0000-000000000009": "omega-station",
};

export type CollectibleUnlock = {
  slug: string;
  setId: string;
};

export type CollectibleSlugLookup = (
  unlocksId: string,
) => Promise<string | null>;

export type CollectibleSlugClient = {
  from: (table: string) => unknown;
};

type CollectibleSlugQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => {
      maybeSingle: () => PromiseLike<{
        data: { slug?: string | null } | null;
        error: unknown;
      }>;
    };
  };
};

export function catalogSlugFromStoredId(storedId: string): string {
  return COLLECTIBLE_UUID_TO_SLUG[storedId] ?? storedId;
}

export async function resolveCollectibleUnlock(
  unlocksId: string | undefined,
  lookupSlug: CollectibleSlugLookup,
): Promise<CollectibleUnlock | null> {
  if (!unlocksId) {
    return null;
  }

  const slug = await lookupSlug(unlocksId);
  if (!slug) {
    return null;
  }

  const found = findCollectibleById(slug);
  if (!found) {
    return null;
  }

  return { slug, setId: found.set.id };
}

export async function lookupCollectibleSlug(
  client: CollectibleSlugClient,
  unlocksId: string,
): Promise<string | null> {
  const query = client.from("collectibles") as CollectibleSlugQuery;
  const { data, error } = await query
    .select("slug")
    .eq("id", unlocksId)
    .maybeSingle();

  if (error || !data?.slug) {
    return null;
  }

  return data.slug;
}

export async function resolveCollectibleUnlockFromDb(
  client: CollectibleSlugClient,
  unlocksId: string | undefined,
): Promise<CollectibleUnlock | null> {
  return resolveCollectibleUnlock(unlocksId, (id) =>
    lookupCollectibleSlug(client, id),
  );
}
