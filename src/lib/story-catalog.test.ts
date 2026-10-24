import { describe, expect, it } from "vitest";
import {
  cardTitleFit,
  isStoryReading,
  isStoryUnlocked,
  pickFeaturedStory,
  pickLeadStory,
  storyAction,
  storyMapMode,
  storyPointsNote,
  storyStateWord,
  titleLines,
} from "@/lib/story-catalog";
import { getStoryPoints, POINTS_EARN_COPY } from "@/lib/story-points";
import {
  sampleBalance,
  sampleStories,
  storiesShowSamples,
} from "@/lib/story-samples";
import { storyWorld, storyWorlds } from "@/lib/story-world";

describe("getStoryPoints", () => {
  it("returns undefined when production rows have no points fields", () => {
    expect(
      getStoryPoints(
        { base_xp: 2500, bypass_xp_cost: 500 } as never,
        { total_xp: 34 } as never,
      ),
    ).toEqual({ cost: undefined, balance: undefined });
    expect(getStoryPoints(null, null)).toEqual({
      cost: undefined,
      balance: undefined,
    });
  });

  it("reads a real price and balance when those fields are present", () => {
    expect(
      getStoryPoints(
        { cost_pts: 30.2, points_cost: 12 },
        { point_balance: 34 },
      ),
    ).toEqual({ cost: 30, balance: 34 });
    expect(getStoryPoints({ points_cost: 20 }, { points: 8 })).toEqual({
      cost: 20,
      balance: 8,
    });
  });

  it("ignores empty or invalid numbers", () => {
    expect(
      getStoryPoints(
        { cost_pts: null, point_price: "30" },
        { points: Number.NaN },
      ),
    ).toEqual({ cost: undefined, balance: undefined });
  });
});

describe("story samples", () => {
  it("follows the home switch and hides the sample catalog in production", () => {
    expect(storiesShowSamples("production")).toBe(false);
    expect(storiesShowSamples("preview")).toBe(true);
    expect(storiesShowSamples(undefined)).toBe(true);
    expect(sampleStories(false)).toEqual([]);
    expect(sampleBalance(false)).toBeUndefined();
  });

  it("loads the sample file only when samples are enabled", () => {
    const stories = sampleStories(true);
    expect(stories.map((story) => story.title)).toContain("The Lantern Road");
    expect(stories.every((story) => story.sample)).toBe(true);
    expect(sampleBalance(true)).toBe(34);
    expect(stories.find((story) => story.id === "station")?.cost).toBe(30);
    expect(POINTS_EARN_COPY).toBe(
      "A page code is 1 pt. The code with a scan of the colored page is 2.",
    );
  });
});

describe("story worlds", () => {
  it("groups by the category string until worlds exist", () => {
    expect(storyWorld("SCI-FI")).toEqual({ id: "scifi", name: "Sci-fi" });
    expect(storyWorld("Sci-Fi")).toEqual({ id: "scifi", name: "Sci-Fi" });
    expect(storyWorld("  ")).toEqual({ id: "stories", name: "Stories" });
    expect(
      storyWorlds([
        { world: storyWorld("Fantasy") },
        { world: storyWorld("FANTASY") },
        { world: storyWorld(null) },
      ]).map((world) => world.id),
    ).toEqual(["fantasy"]);
  });
});

describe("story catalog rules", () => {
  it("keeps today's unlock rule", () => {
    expect(
      isStoryUnlocked({
        hasRequirements: false,
        hasCodeNeeded: false,
        hasProgress: false,
      }),
    ).toBe(true);
    expect(
      isStoryUnlocked({
        hasRequirements: true,
        hasCodeNeeded: false,
        hasProgress: false,
      }),
    ).toBe(false);
    expect(
      isStoryUnlocked({
        hasRequirements: false,
        hasCodeNeeded: true,
        hasProgress: true,
      }),
    ).toBe(true);
  });

  it("leads with the last story being read, and features the first when signed out", () => {
    const stories = [
      { id: "a", reading: false, startedAt: "2020" },
      { id: "b", reading: true, startedAt: "2024-01-01" },
      { id: "c", reading: true, startedAt: "2025-01-01" },
    ];
    expect(pickLeadStory(stories)?.id).toBe("c");
    expect(pickLeadStory([{ id: "a", reading: false }])).toBeNull();
    expect(pickFeaturedStory(stories)?.id).toBe("a");
    expect(pickFeaturedStory([])).toBeNull();
  });

  it("uses state words without inventing a price", () => {
    expect(
      storyStateWord({
        signedIn: true,
        unlocked: true,
        reading: true,
        codeNeeded: false,
      }),
    ).toBe("Yours · reading");
    expect(
      storyStateWord({
        signedIn: true,
        unlocked: true,
        reading: false,
        codeNeeded: false,
      }),
    ).toBe("Yours");
    expect(
      storyStateWord({
        signedIn: true,
        unlocked: false,
        reading: false,
        codeNeeded: true,
      }),
    ).toBe("Code required");
    expect(
      storyStateWord({
        signedIn: false,
        unlocked: false,
        reading: false,
        codeNeeded: true,
      }),
    ).toBe("Locked");
    expect(
      storyStateWord({
        signedIn: true,
        unlocked: false,
        reading: false,
        codeNeeded: true,
        cost: 30,
      }),
    ).toBe("30 pts");
  });

  it("does not turn a locked story into a points purchase", () => {
    expect(
      storyAction({
        signedIn: true,
        unlocked: false,
        reading: false,
        href: "/stories/1",
      }),
    ).toEqual({ type: "code", label: "Code required" });
    expect(
      storyAction({
        signedIn: false,
        unlocked: false,
        reading: false,
        href: "/stories/1",
      }).type,
    ).toBe("sign-in");
    expect(
      storyAction({
        signedIn: true,
        unlocked: false,
        reading: false,
        productHref: "/store/book",
        href: "/stories/1",
      }),
    ).toEqual({ type: "book", href: "/store/book", label: "Get the book" });
    expect(
      storyAction({
        signedIn: true,
        unlocked: true,
        reading: true,
        href: "/stories/1",
      }).label,
    ).toBe("Continue");
    expect(storyPointsNote({ cost: 40, balance: 34, locked: true })).toBe(
      "This one is 40 pts. You have 34.",
    );
    expect(storyPointsNote({ cost: 20, balance: 34, locked: true })).toBe(
      "You have 34 pts.",
    );
    expect(storyPointsNote({ locked: true })).toBeUndefined();
  });

  it("ghosts a locked signed-in map and leaves signed-out maps open", () => {
    expect(
      storyMapMode({ signedIn: false, unlocked: false, reading: false }),
    ).toBe("open");
    expect(
      storyMapMode({ signedIn: true, unlocked: false, reading: false }),
    ).toBe("ghost");
    expect(
      storyMapMode({ signedIn: true, unlocked: true, reading: true }),
    ).toBe("lit");
    expect(
      isStoryReading({
        unlocked: true,
        completed: false,
        completedCount: 1,
        currentId: "b",
      }),
    ).toBe(true);
    expect(titleLines("The Lantern Road")).toEqual(["The Lantern", "Road"]);
    expect(cardTitleFit([["The Door", "in the Tide"]]).mobile).toBeGreaterThan(
      0,
    );
  });
});
