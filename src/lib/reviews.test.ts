import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { fetchProductReviews, mergeReviewsWithProfiles } from "@/lib/reviews";

const reviewRow = {
  id: "rev-1",
  product_id: "prod-1",
  user_id: "user-1",
  rating: 5,
  title: "Great",
  comment: "Loved it",
  is_verified_purchase: false,
  helpful_count: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("mergeReviewsWithProfiles", () => {
  it("attaches matching profiles and leaves missing ones unset", () => {
    const merged = mergeReviewsWithProfiles(
      [reviewRow, { ...reviewRow, id: "rev-2", user_id: "missing" }],
      [{ id: "user-1", display_name: "Ada", avatar_url: "/a.png" }],
    );
    expect(merged[0]?.user).toEqual({
      display_name: "Ada",
      avatar_url: "/a.png",
    });
    expect(merged[1]?.user).toBeUndefined();
  });

  it("returns an empty list when there are no reviews", () => {
    expect(mergeReviewsWithProfiles([], [{ id: "user-1" }])).toEqual([]);
  });

  it("survives a null profiles result", () => {
    expect(
      mergeReviewsWithProfiles([reviewRow], null)[0]?.user,
    ).toBeUndefined();
  });
});

describe("fetchProductReviews", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("loads reviews then profiles by user_id without the broken embed", async () => {
    const tables: string[] = [];
    const reviewSelects: string[] = [];
    const profileIns: string[][] = [];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      tables.push(table);
      if (table === "reviews") {
        return {
          select: (columns: string) => {
            reviewSelects.push(columns);
            return {
              eq: () => ({
                order: async () => ({ data: [reviewRow], error: null }),
              }),
            };
          },
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return {
        select: () => ({
          in: (_column: string, ids: string[]) => {
            profileIns.push(ids);
            return Promise.resolve({
              data: [{ id: "user-1", display_name: "Ada", avatar_url: null }],
              error: null,
            });
          },
        }),
      } as unknown as ReturnType<typeof supabase.from>;
    });

    const { data, error } = await fetchProductReviews("prod-1");
    expect(error).toBeNull();
    expect(tables).toEqual(["reviews", "profiles"]);
    expect(reviewSelects[0]).not.toMatch(/profiles!reviews_user_id_fkey/);
    expect(profileIns).toEqual([["user-1"]]);
    expect(data?.[0]?.user?.display_name).toBe("Ada");
  });

  it("returns an empty list without querying profiles", async () => {
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
        }) as unknown as ReturnType<typeof supabase.from>,
    );

    const { data, error } = await fetchProductReviews("prod-1");
    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it("still returns reviews when the profiles query fails", async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "reviews") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [reviewRow], error: null }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return {
        select: () => ({
          in: async () => ({
            data: null,
            error: { message: "permission denied" },
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>;
    });

    const { data, error } = await fetchProductReviews("prod-1");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.user).toBeUndefined();
  });
});
