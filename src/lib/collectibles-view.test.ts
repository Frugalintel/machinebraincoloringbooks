import { describe, expect, it } from "vitest";
import {
  achievementRef,
  artifactOf,
  buildDetail,
  buildVitrine,
  filterSets,
  itemArt,
  newestEntry,
  rarestEntry,
  rarityPips,
  readerMode,
  rewardState,
  setProgress,
  storyRef,
  type VitrineInput,
} from "@/lib/collectibles-view";
import {
  COLLECTIBLES_FIXTURE_OWNED,
  collectiblesPreview,
  fixtureCollectedIds,
  fixtureStamps,
} from "@/lib/collectibles-fixture";
import {
  achievements,
  collectionSets,
  type CollectibleItem,
  type CollectionSet,
} from "@/lib/game-data";
import { homeShowsSamples } from "@/lib/home";

function item(
  partial: Pick<CollectibleItem, "id" | "name" | "rarity" | "requirement"> &
    Partial<CollectibleItem>,
): CollectibleItem {
  return {
    image: "bg-surface-2",
    lore: "Lore line.",
    type: "Unit",
    generation: "Gen-1",
    foundIn: "Sector 1",
    ...partial,
  };
}

function setOf(
  id: string,
  title: string,
  items: CollectibleItem[],
  reward = "Reward",
): CollectionSet {
  return { id, title, total: 99, collected: [], reward, items };
}

const pup = item({
  id: "pup",
  name: "Pup",
  rarity: "Common",
  requirement: "Code: DOG",
});
const hound = item({
  id: "hound",
  name: "Hound",
  rarity: "Legendary",
  requirement: "Reach Level 5",
  unlocksStoryId: "missing-story",
  art: "/collectibles/hound.webp",
});
const wing = item({
  id: "wing",
  name: "Wing",
  rarity: "Rare",
  requirement: "Submit 5 pages",
  relatedAchievementId: "ach-missing",
});

const catalog: CollectionSet[] = [
  setOf("set-a", "Vacuum Pups", [pup, hound], "Mecha-Pup Trophy"),
  setOf("set-b", "Star Drifter", [wing], "Galactic Cruiser Model"),
];

function input(
  partial: Partial<VitrineInput> & Pick<VitrineInput, "signedIn">,
): VitrineInput {
  return {
    catalog,
    collectedIds: new Set(),
    stamps: {},
    stories: [],
    achievements: [],
    setFilter: null,
    ...partial,
  };
}

describe("rarity pips", () => {
  it("maps the five words onto one through five pips", () => {
    expect(rarityPips("Common")).toBe(1);
    expect(rarityPips("Uncommon")).toBe(2);
    expect(rarityPips("Rare")).toBe(3);
    expect(rarityPips("Epic")).toBe(4);
    expect(rarityPips("Legendary")).toBe(5);
  });

  it("lights no pips for an unknown word", () => {
    expect(rarityPips("Mythic")).toBe(0);
  });
});

describe("item art", () => {
  it("uses the cream placeholder when an item has no still", () => {
    expect(itemArt(pup)).toEqual({ kind: "placeholder" });
    expect(itemArt({ art: "bg-surface-2" })).toEqual({ kind: "placeholder" });
    expect(itemArt({ art: "  " })).toEqual({ kind: "placeholder" });
  });

  it("keeps a future path without changing the slot", () => {
    expect(itemArt(hound)).toEqual({
      kind: "still",
      src: "/collectibles/hound.webp",
    });
    expect(itemArt({ art: "https://cdn.example/hound.webp" })).toEqual({
      kind: "still",
      src: "https://cdn.example/hound.webp",
    });
  });
});

describe("set progress and reward", () => {
  it("derives x/total from the items, and keeps the reward a ghost", () => {
    const progress = setProgress(catalog[0]!, new Set(["pup"]));
    expect(progress).toEqual({ owned: 1, total: 2, complete: false });
    expect(catalog[0]!.total).toBe(99);
    expect(rewardState(progress, "Mecha-Pup Trophy")).toEqual({
      name: "Mecha-Pup Trophy",
      lit: false,
      line: "Yours when all 2 are collected.",
    });
  });

  it("lights the reward only when every item in the set is collected", () => {
    const progress = setProgress(catalog[0]!, new Set(["pup", "hound"]));
    expect(progress.complete).toBe(true);
    expect(rewardState(progress, "Mecha-Pup Trophy").lit).toBe(true);
  });
});

describe("reader states", () => {
  it("signs out with every item locked and the rarest ghost in the hero", () => {
    expect(readerMode(false, 4)).toBe("signed-out");
    const view = buildVitrine(input({ signedIn: false }));
    expect(view.mode).toBe("signed-out");
    expect(view.hero?.kind).toBe("locked");
    expect(view.hero?.item.id).toBe("hound");
    expect(rarestEntry(catalog)?.item.id).toBe("hound");
    expect(
      view.sets.flatMap((set) => set.bays).every((bay) => !bay.owned),
    ).toBe(true);
    expect(view.sets[0]?.progress).toEqual({
      owned: 0,
      total: 2,
      complete: false,
    });
  });

  it("shows the first item when a reader has collected nothing", () => {
    const view = buildVitrine(input({ signedIn: true }));
    expect(view.mode).toBe("empty");
    expect(view.hero?.kind).toBe("empty");
    expect(view.hero?.item.id).toBe("pup");
    expect(
      view.hero && "requirement" in view.hero && view.hero.requirement,
    ).toBe("Code: DOG");
    expect(view.sets[0]?.bays[0]?.art).toEqual({ kind: "placeholder" });
  });

  it("puts the newest unlock under the lamp and counts the rest", () => {
    const view = buildVitrine(
      input({
        signedIn: true,
        collectedIds: new Set(["pup", "wing"]),
        stamps: {
          pup: { unlockedAt: "2026-10-02T12:00:00.000Z" },
          wing: { unlockedAt: "2026-10-21T12:00:00.000Z" },
        },
      }),
    );
    expect(view.mode).toBe("some");
    expect(view.hero?.kind).toBe("newest");
    expect(view.hero?.item.id).toBe("wing");
    if (view.hero?.kind === "newest") {
      expect(view.hero.ownedOn).toBe("21 Oct 2026");
    }
    expect(newestEntry(catalog, new Set(["pup"]), {})?.item.id).toBe("pup");
    expect(view.sets[0]?.progress.owned).toBe(1);
    expect(view.sets[1]?.progress.owned).toBe(1);
    expect(view.sets[0]?.bays[0]?.ownedOn).toBe("2 Oct 2026");
    expect(view.sets[1]?.bays[0]?.owned).toBe(true);
    expect(view.sets[0]?.bays[1]?.owned).toBe(false);
    expect(view.sets[0]?.bays[1]?.art).toEqual({
      kind: "still",
      src: "/collectibles/hound.webp",
    });
  });

  it("leaves a story or achievement as plain text when nothing matches", () => {
    expect(storyRef("missing-story", [])).toEqual({ label: "missing-story" });
    expect(
      storyRef("story-1", [{ id: "story-1", title: "Last Light" }]),
    ).toEqual({
      label: "Last Light",
      href: "/stories/story-1",
    });
    expect(achievementRef("ach-missing", [])).toEqual({ label: "ach-missing" });
    expect(
      achievementRef("ach-01", [{ id: "ach-01", title: "First Splash" }]),
    ).toEqual({ label: "First Splash", href: "/achievements#ach-01" });
    const view = buildVitrine(
      input({
        signedIn: false,
        stories: [],
        achievements: [],
      }),
    );
    const houndBay = view.sets[0]?.bays[1];
    expect(houndBay?.lines).toEqual([
      { kind: "opens", ref: { label: "missing-story" } },
    ]);
    expect(houndBay?.lines[0]?.ref.href).toBeUndefined();
  });

  it("filters a set from ?set= and keeps the page when the key is unknown", () => {
    const filtered = buildVitrine(
      input({ signedIn: false, setFilter: "star-drifter" }),
    );
    expect(filtered.sets.map((set) => set.visible)).toEqual([false, true]);
    expect(filterSets(catalog, "set-a").map((set) => set.id)).toEqual([
      "set-a",
    ]);
    expect(filterSets(catalog, "nope").map((set) => set.id)).toEqual([
      "set-a",
      "set-b",
    ]);
    expect(artifactOf(1, 4)).toBe("No. 02 of 04");
  });
});

describe("detail", () => {
  it("returns null for an unknown id so the route can 404", () => {
    expect(
      buildDetail({ ...input({ signedIn: false }), itemId: "missing" }),
    ).toBeNull();
  });

  it("leads a locked item with its requirement and a code action", () => {
    const detail = buildDetail({
      ...input({ signedIn: true }),
      itemId: "hound",
    });
    expect(detail?.owned).toBe(false);
    expect(detail?.action).toBe("code");
    expect(detail?.requirement).toBe("Reach Level 5");
    expect(detail?.art).toEqual({
      kind: "still",
      src: "/collectibles/hound.webp",
    });
    expect(detail?.spec.map((row) => row.label)).not.toContain("Collected");
    expect(detail?.ofLabel).toBe("No. 02 of 02");
  });

  it("shows the collected date and Trophy Room once the item is owned", () => {
    const detail = buildDetail({
      ...input({
        signedIn: true,
        collectedIds: new Set(["pup"]),
        stamps: { pup: { unlockedAt: "2026-10-02T12:00:00.000Z" } },
      }),
      itemId: "pup",
    });
    expect(detail?.owned).toBe(true);
    expect(detail?.action).toBe("trophy-room");
    expect(detail?.ownedOn).toBe("2 Oct 2026");
    expect(detail?.art.kind).toBe("placeholder");
    expect(detail?.spec.find((row) => row.label === "Collected")?.value).toBe(
      "2 Oct 2026",
    );
  });
});

describe("dev fixture", () => {
  it("is unavailable in production and only owns real catalog ids", () => {
    expect(
      collectiblesPreview(homeShowsSamples("production"), "some"),
    ).toBeNull();
    expect(collectiblesPreview(homeShowsSamples("preview"), "some")).toBe(
      "some",
    );
    expect(collectiblesPreview(homeShowsSamples(undefined), "nope")).toBeNull();
    const ids = new Set(
      collectionSets.flatMap((set) => set.items.map((entry) => entry.id)),
    );
    for (const id of Object.keys(COLLECTIBLES_FIXTURE_OWNED)) {
      expect(ids.has(id)).toBe(true);
    }
    const view = buildVitrine({
      catalog: collectionSets,
      signedIn: true,
      collectedIds: fixtureCollectedIds(),
      stamps: fixtureStamps(),
      stories: [],
      achievements,
      setFilter: null,
    });
    expect(view.mode).toBe("some");
    expect(view.hero?.kind).toBe("newest");
    expect(view.hero?.item.id).toBe("atomic-poodle");
    expect(view.sets[0]?.progress).toEqual({
      owned: 3,
      total: collectionSets[0]!.items.length,
      complete: false,
    });
  });
});
