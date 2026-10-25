import type { CollectibleItem, CollectionSet } from "@/lib/game-data";
import { interTitleEm, redactionTitleEm } from "@/lib/story-title-fit";

/** One ink. Common is one pip, Legendary is five. Unknown words light none. */
export const RARITY_PIPS = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
} as const;

export type RarityName = keyof typeof RARITY_PIPS;

const PIP_TOTAL = 5;

export function rarityPips(rarity: string): number {
  if (Object.prototype.hasOwnProperty.call(RARITY_PIPS, rarity)) {
    return RARITY_PIPS[rarity as RarityName];
  }
  return 0;
}

export function rarityLabel(rarity: string): string {
  const lit = rarityPips(rarity);
  return `Rarity ${lit} of ${PIP_TOTAL}`;
}

export type ArtState = { kind: "still"; src: string } | { kind: "placeholder" };

const ART_PATH = /^(?:\/|https?:\/\/)/;

/**
 * Locked slots use a still only when a future `art` path is set.
 * The catalog `image` field is a CSS class, not a picture.
 */
export function itemArt(item: Pick<CollectibleItem, "art">): ArtState {
  const art = item.art?.trim();
  if (art && ART_PATH.test(art)) {
    return { kind: "still", src: art };
  }
  return { kind: "placeholder" };
}

export type ReaderMode = "signed-out" | "empty" | "some";

export function readerMode(signedIn: boolean, ownedCount: number): ReaderMode {
  if (!signedIn) return "signed-out";
  if (ownedCount <= 0) return "empty";
  return "some";
}

export type NamedRef = {
  label: string;
  href?: string;
};

export function storyRef(
  id: string | undefined,
  stories: readonly { id: string; title: string }[],
): NamedRef | null {
  if (!id) return null;
  const match = stories.find((story) => story.id === id);
  if (!match) return { label: id };
  return { label: match.title, href: `/stories/${match.id}` };
}

export function achievementRef(
  id: string | undefined,
  achievements: readonly { id: string; title: string }[],
): NamedRef | null {
  if (!id) return null;
  const match = achievements.find((achievement) => achievement.id === id);
  if (!match) return { label: id };
  return { label: match.title, href: `/achievements#${match.id}` };
}

export type LinkLine =
  | { kind: "achievement"; ref: NamedRef }
  | { kind: "opens"; ref: NamedRef }
  | { kind: "granted"; ref: NamedRef };

export function linkLines(
  item: Pick<
    CollectibleItem,
    "relatedAchievementId" | "unlocksStoryId" | "grantedByStoryId"
  >,
  stories: readonly { id: string; title: string }[],
  achievements: readonly { id: string; title: string }[],
): LinkLine[] {
  const lines: LinkLine[] = [];
  const achievement = achievementRef(item.relatedAchievementId, achievements);
  if (achievement) lines.push({ kind: "achievement", ref: achievement });
  const opens = storyRef(item.unlocksStoryId, stories);
  if (opens) lines.push({ kind: "opens", ref: opens });
  const granted = storyRef(item.grantedByStoryId, stories);
  if (granted) lines.push({ kind: "granted", ref: granted });
  return lines;
}

export type SetProgress = {
  owned: number;
  total: number;
  complete: boolean;
};

/** Totals come from the items actually in the set, not a separate count. */
export function setProgress(
  set: Pick<CollectionSet, "items">,
  collectedIds: ReadonlySet<string>,
): SetProgress {
  const total = set.items.length;
  let owned = 0;
  for (const item of set.items) {
    if (collectedIds.has(item.id)) owned += 1;
  }
  return { owned, total, complete: total > 0 && owned === total };
}

export type RewardState = {
  name: string;
  lit: boolean;
  line: string;
};

export function rewardState(
  progress: SetProgress,
  rewardName: string,
): RewardState {
  return {
    name: rewardName,
    lit: progress.complete,
    line: `Yours when all ${progress.total} are collected.`,
  };
}

export function setSlug(set: Pick<CollectionSet, "id" | "title">): string {
  const fromTitle = set.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return fromTitle || set.id;
}

export function filterSets<T extends Pick<CollectionSet, "id" | "title">>(
  sets: readonly T[],
  filter: string | null | undefined,
): T[] {
  const raw = filter?.trim().toLowerCase();
  if (!raw || raw === "all") return [...sets];
  const matched = sets.filter(
    (set) => set.id.toLowerCase() === raw || setSlug(set) === raw,
  );
  return matched.length > 0 ? matched : [...sets];
}

export function ownedOn(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function artifactNo(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function artifactOf(index: number, total: number): string {
  return `No. ${artifactNo(index)} of ${String(total).padStart(2, "0")}`;
}

export type CatalogEntry = {
  item: CollectibleItem;
  set: CollectionSet;
  setIndex: number;
  itemIndex: number;
};

export function walkCatalog(catalog: readonly CollectionSet[]): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  catalog.forEach((set, setIndex) => {
    set.items.forEach((item, itemIndex) => {
      entries.push({ item, set, setIndex, itemIndex });
    });
  });
  return entries;
}

export function ownedEntries(
  catalog: readonly CollectionSet[],
  collectedIds: ReadonlySet<string>,
): CatalogEntry[] {
  return walkCatalog(catalog).filter((entry) =>
    collectedIds.has(entry.item.id),
  );
}

/** Highest rarity. A tie keeps the earlier item in the catalog. */
export function rarestEntry(
  catalog: readonly CollectionSet[],
): CatalogEntry | null {
  const entries = walkCatalog(catalog);
  let best: CatalogEntry | null = null;
  for (const entry of entries) {
    if (!best || rarityPips(entry.item.rarity) > rarityPips(best.item.rarity)) {
      best = entry;
    }
  }
  return best;
}

export function firstEntry(
  catalog: readonly CollectionSet[],
): CatalogEntry | null {
  return walkCatalog(catalog)[0] ?? null;
}

export function newestEntry(
  catalog: readonly CollectionSet[],
  collectedIds: ReadonlySet<string>,
  unlockedAt: Readonly<Record<string, string | undefined>>,
): CatalogEntry | null {
  let best: { entry: CatalogEntry; time: number } | null = null;
  for (const entry of ownedEntries(catalog, collectedIds)) {
    const raw = unlockedAt[entry.item.id];
    const parsed = raw ? Date.parse(raw) : Number.NaN;
    const time = Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
    if (!best || time > best.time) best = { entry, time };
  }
  return best?.entry ?? null;
}

const INDEX_TITLE = "Collectibles.";

export function indexTitleEm(): number {
  return redactionTitleEm(INDEX_TITLE);
}

export function sharedSetTitleEm(catalog: readonly CollectionSet[]): number {
  let longest = 0;
  for (const set of catalog) {
    longest = Math.max(longest, interTitleEm(set.title));
  }
  return longest;
}

export function detailTitleEm(name: string): number {
  return redactionTitleEm(name);
}

export type Stamp = {
  unlockedAt?: string;
  lastPolishedAt?: string;
};

export type BayModel = {
  id: string;
  name: string;
  no: string;
  owned: boolean;
  rarity: string;
  requirement: string;
  ownedOn: string | null;
  art: ArtState;
  href: string;
  lines: LinkLine[];
  item: CollectibleItem;
  unlockedAt?: string;
  lastPolishedAt?: string;
};

export type SetCaseModel = {
  id: string;
  slug: string;
  anchor: string;
  indexLabel: string;
  title: string;
  progress: SetProgress;
  reward: RewardState;
  bays: BayModel[];
  visible: boolean;
};

export type HeroModel = {
  item: CollectibleItem;
  href: string;
  rarity: string;
  requirement: string;
  art: ArtState;
  unlockedAt?: string;
  lastPolishedAt?: string;
} & (
  | { kind: "newest"; ownedOn: string | null }
  | { kind: "locked" }
  | { kind: "empty" }
);

export type VitrineModel = {
  mode: ReaderMode;
  title: string;
  titleEm: number;
  setTitleEm: number;
  hero: HeroModel | null;
  sets: SetCaseModel[];
};

export type VitrineInput = {
  catalog: readonly CollectionSet[];
  signedIn: boolean;
  collectedIds: ReadonlySet<string>;
  stamps: Readonly<Record<string, Stamp | undefined>>;
  stories: readonly { id: string; title: string }[];
  achievements: readonly { id: string; title: string }[];
  setFilter: string | null;
};

function bayFor(entry: CatalogEntry, input: VitrineInput): BayModel {
  const owned = input.signedIn && input.collectedIds.has(entry.item.id);
  const stamp = input.stamps[entry.item.id];
  return {
    id: entry.item.id,
    name: entry.item.name,
    no: artifactNo(entry.itemIndex),
    owned,
    rarity: entry.item.rarity,
    requirement: entry.item.requirement,
    ownedOn: owned ? ownedOn(stamp?.unlockedAt) : null,
    art: itemArt(entry.item),
    href: `/collectibles/${entry.item.id}`,
    lines: linkLines(entry.item, input.stories, input.achievements),
    item: entry.item,
    unlockedAt: owned ? stamp?.unlockedAt : undefined,
    lastPolishedAt: owned ? stamp?.lastPolishedAt : undefined,
  };
}

function caseFor(
  set: CollectionSet,
  setIndex: number,
  input: VitrineInput,
  visibleIds: ReadonlySet<string>,
): SetCaseModel {
  const progress = setProgress(
    set,
    input.signedIn ? input.collectedIds : new Set(),
  );
  const entries = set.items.map((item, itemIndex) => ({
    item,
    set,
    setIndex,
    itemIndex,
  }));
  return {
    id: set.id,
    slug: setSlug(set),
    anchor: `s-${setSlug(set)}`,
    indexLabel: `Set ${setIndex + 1}`,
    title: set.title,
    progress,
    reward: rewardState(progress, set.reward),
    bays: entries.map((entry) => bayFor(entry, input)),
    visible: visibleIds.has(set.id),
  };
}

function heroFor(input: VitrineInput, mode: ReaderMode): HeroModel | null {
  const entry =
    mode === "some"
      ? newestEntry(
          input.catalog,
          input.collectedIds,
          Object.fromEntries(
            Object.entries(input.stamps).map(([id, stamp]) => [
              id,
              stamp?.unlockedAt,
            ]),
          ),
        )
      : mode === "empty"
        ? firstEntry(input.catalog)
        : rarestEntry(input.catalog);
  if (!entry) return null;
  const stamp = input.stamps[entry.item.id];
  const base = {
    item: entry.item,
    href: `/collectibles/${entry.item.id}`,
    rarity: entry.item.rarity,
    requirement: entry.item.requirement,
    art: itemArt(entry.item),
    unlockedAt: mode === "some" ? stamp?.unlockedAt : undefined,
    lastPolishedAt: mode === "some" ? stamp?.lastPolishedAt : undefined,
  };
  switch (mode) {
    case "some":
      return {
        ...base,
        kind: "newest",
        ownedOn: ownedOn(stamp?.unlockedAt),
      };
    case "signed-out":
      return { ...base, kind: "locked" };
    case "empty":
      return { ...base, kind: "empty" };
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function buildVitrine(input: VitrineInput): VitrineModel {
  const ownedCount = input.signedIn
    ? ownedEntries(input.catalog, input.collectedIds).length
    : 0;
  const mode = readerMode(input.signedIn, ownedCount);
  const visible = filterSets(input.catalog, input.setFilter);
  const visibleIds = new Set(visible.map((set) => set.id));
  return {
    mode,
    title: INDEX_TITLE,
    titleEm: indexTitleEm(),
    setTitleEm: sharedSetTitleEm(input.catalog),
    hero: heroFor(input, mode),
    sets: input.catalog.map((set, index) =>
      caseFor(set, index, input, visibleIds),
    ),
  };
}

export type SpecRow = { label: string; value: string };

export type DetailModel = {
  item: CollectibleItem;
  owned: boolean;
  mode: ReaderMode;
  titleEm: number;
  rarity: string;
  art: ArtState;
  requirement: string;
  lore: string;
  ownedOn: string | null;
  ofLabel: string;
  runningHead: readonly [string, string, string];
  lines: LinkLine[];
  spec: SpecRow[];
  action: "trophy-room" | "code";
  setTitleEm: number;
  setCase: SetCaseModel;
  unlockedAt?: string;
  lastPolishedAt?: string;
};

export function buildDetail(
  input: VitrineInput & { itemId: string },
): DetailModel | null {
  const entries = walkCatalog(input.catalog);
  const entry = entries.find((candidate) => candidate.item.id === input.itemId);
  if (!entry) return null;
  const vitrine = buildVitrine(input);
  const setCase = vitrine.sets.find((set) => set.id === entry.set.id);
  if (!setCase) return null;
  const owned = input.signedIn && input.collectedIds.has(entry.item.id);
  const stamp = input.stamps[entry.item.id];
  const date = owned ? ownedOn(stamp?.unlockedAt) : null;
  const spec: SpecRow[] = [
    {
      label: "Set",
      value: `${setCase.indexLabel} · ${entry.set.title}`,
    },
    { label: "Rarity", value: entry.item.rarity },
    { label: "Type", value: entry.item.type },
    { label: "Generation", value: entry.item.generation },
    { label: "Found in", value: entry.item.foundIn },
  ];
  if (owned) {
    spec.push({ label: "Requirement", value: entry.item.requirement });
    if (date) spec.push({ label: "Collected", value: date });
  }
  return {
    item: entry.item,
    owned,
    mode: vitrine.mode,
    titleEm: detailTitleEm(entry.item.name),
    rarity: entry.item.rarity,
    art: itemArt(entry.item),
    requirement: entry.item.requirement,
    lore: entry.item.lore,
    ownedOn: date,
    ofLabel: artifactOf(entry.itemIndex, entry.set.items.length),
    runningHead: [
      `${setCase.indexLabel} · ${entry.set.title}`,
      artifactOf(entry.itemIndex, entry.set.items.length),
      owned ? "Owned" : "Locked",
    ],
    lines: linkLines(entry.item, input.stories, input.achievements),
    spec,
    action: owned ? "trophy-room" : "code",
    setTitleEm: vitrine.setTitleEm,
    setCase: { ...setCase, visible: true },
    unlockedAt: owned ? stamp?.unlockedAt : undefined,
    lastPolishedAt: owned ? stamp?.lastPolishedAt : undefined,
  };
}
