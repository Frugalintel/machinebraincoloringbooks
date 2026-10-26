import { describe, expect, it } from "vitest";
import { gameFetchPlan } from "@/lib/game-user-queries";

describe("gameFetchPlan", () => {
  it("skips user_books and other user-only tables when there is no user", () => {
    expect(gameFetchPlan(null).userTables).toEqual([]);
    expect(gameFetchPlan(undefined).userTables).toEqual([]);
    expect(gameFetchPlan("").userTables).toEqual([]);
    expect(gameFetchPlan(null).userTables).not.toContain("user_books");
  });

  it("includes user_books only when a user id is present", () => {
    const plan = gameFetchPlan("user-1");
    expect(plan.userTables).toContain("user_books");
    expect(plan.userTables).toContain("user_achievements");
    expect(plan.userTables).toContain("user_collectibles");
    expect(plan.userTables).toContain("user_story_progress");
    expect(plan.userTables).toContain("user_trophy_customizations");
  });
});
