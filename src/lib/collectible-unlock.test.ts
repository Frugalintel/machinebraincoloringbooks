import { describe, expect, it, vi } from "vitest";
import {
  COLLECTIBLE_UUID_TO_SLUG,
  catalogSlugFromStoredId,
  lookupCollectibleSlug,
  resolveCollectibleUnlock,
} from "@/lib/collectible-unlock";

const UUIDS = {
  "rover-x": "30000000-0000-0000-0000-000000000001",
  "cyber-spaniel": "30000000-0000-0000-0000-000000000002",
  "atomic-poodle": "30000000-0000-0000-0000-000000000003",
  "quantum-bulldog": "30000000-0000-0000-0000-000000000004",
  "alpha-wing": "30000000-0000-0000-0000-000000000005",
  "beta-destroyer": "30000000-0000-0000-0000-000000000006",
  "gamma-scout": "30000000-0000-0000-0000-000000000007",
  "delta-cruiser": "30000000-0000-0000-0000-000000000008",
  "omega-station": "30000000-0000-0000-0000-000000000009",
} as const;

describe("COLLECTIBLE_UUID_TO_SLUG", () => {
  it("maps each prod collectible uuid to its catalog slug", () => {
    expect(COLLECTIBLE_UUID_TO_SLUG).toEqual({
      [UUIDS["rover-x"]]: "rover-x",
      [UUIDS["cyber-spaniel"]]: "cyber-spaniel",
      [UUIDS["atomic-poodle"]]: "atomic-poodle",
      [UUIDS["quantum-bulldog"]]: "quantum-bulldog",
      [UUIDS["alpha-wing"]]: "alpha-wing",
      [UUIDS["beta-destroyer"]]: "beta-destroyer",
      [UUIDS["gamma-scout"]]: "gamma-scout",
      [UUIDS["delta-cruiser"]]: "delta-cruiser",
      [UUIDS["omega-station"]]: "omega-station",
    });
  });
});

describe("catalogSlugFromStoredId", () => {
  it("maps a stored uuid onto the catalog slug", () => {
    expect(catalogSlugFromStoredId(UUIDS["rover-x"])).toBe("rover-x");
    expect(catalogSlugFromStoredId(UUIDS["omega-station"])).toBe(
      "omega-station",
    );
  });

  it("leaves an already-catalog slug unchanged", () => {
    expect(catalogSlugFromStoredId("atomic-poodle")).toBe("atomic-poodle");
  });

  it("leaves an unknown id unchanged so a bad row cannot become a catalog hit", () => {
    expect(
      catalogSlugFromStoredId("30000000-0000-0000-0000-000000000099"),
    ).toBe("30000000-0000-0000-0000-000000000099");
  });
});

describe("resolveCollectibleUnlock", () => {
  it("returns the catalog slug and static set id when the lookup finds a slug", async () => {
    const lookupSlug = vi.fn(async () => "rover-x");

    await expect(
      resolveCollectibleUnlock(UUIDS["rover-x"], lookupSlug),
    ).resolves.toEqual({ slug: "rover-x", setId: "set-01" });
    expect(lookupSlug).toHaveBeenCalledWith(UUIDS["rover-x"]);
  });

  it("derives set-02 from the catalog when the slug belongs there", async () => {
    await expect(
      resolveCollectibleUnlock(UUIDS["alpha-wing"], async () => "alpha-wing"),
    ).resolves.toEqual({ slug: "alpha-wing", setId: "set-02" });
  });

  it("returns null when the lookup slug is missing so a uuid is never granted", async () => {
    await expect(
      resolveCollectibleUnlock(UUIDS["rover-x"], async () => null),
    ).resolves.toBeNull();
  });

  it("returns null when the slug is not in the static catalog", async () => {
    await expect(
      resolveCollectibleUnlock(
        UUIDS["rover-x"],
        async () => "not-a-catalog-item",
      ),
    ).resolves.toBeNull();
  });

  it("returns null when unlocks_id is empty", async () => {
    const lookupSlug = vi.fn(async () => "rover-x");
    await expect(resolveCollectibleUnlock("", lookupSlug)).resolves.toBeNull();
    await expect(
      resolveCollectibleUnlock(undefined, lookupSlug),
    ).resolves.toBeNull();
    expect(lookupSlug).not.toHaveBeenCalled();
  });
});

describe("lookupCollectibleSlug", () => {
  it("selects slug from collectibles by id", async () => {
    const maybeSingle = vi.fn(async () => ({
      data: { slug: "quantum-bulldog" },
      error: null,
    }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    await expect(
      lookupCollectibleSlug({ from }, UUIDS["quantum-bulldog"]),
    ).resolves.toBe("quantum-bulldog");
    expect(from).toHaveBeenCalledWith("collectibles");
    expect(select).toHaveBeenCalledWith("slug");
    expect(eq).toHaveBeenCalledWith("id", UUIDS["quantum-bulldog"]);
  });

  it("returns null when the row has no slug", async () => {
    await expect(
      lookupCollectibleSlug(
        {
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { slug: null },
                  error: null,
                }),
              }),
            }),
          }),
        },
        UUIDS["rover-x"],
      ),
    ).resolves.toBeNull();
  });

  it("returns null when the query errors", async () => {
    await expect(
      lookupCollectibleSlug(
        {
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: { message: "permission denied" },
                }),
              }),
            }),
          }),
        },
        UUIDS["rover-x"],
      ),
    ).resolves.toBeNull();
  });
});
