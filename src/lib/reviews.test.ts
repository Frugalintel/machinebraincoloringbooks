import { beforeEach, describe, expect, it, vi } from "vitest";

const REVIEW_COLUMNS = [
  "id",
  "product_id",
  "user_id",
  "rating",
  "title",
  "comment",
  "is_verified_purchase",
  "helpful_count",
  "created_at",
  "updated_at",
];

const db = vi.hoisted(() => ({
  calls: [] as { table: string; method: string; args: unknown[] }[],
  reviews: [] as Record<string, unknown>[],
  reviewsError: null as { message: string } | null,
  profiles: [] as Record<string, unknown>[],
  profilesError: null as { message: string } | null,
}));

vi.mock("@/lib/supabase", () => {
  function builder(table: string) {
    const api = {
      select(columns: string) {
        db.calls.push({ table, method: "select", args: [columns] });
        return api;
      },
      eq(column: string, value: unknown) {
        db.calls.push({ table, method: "eq", args: [column, value] });
        return api;
      },
      order(column: string, options?: unknown) {
        db.calls.push({ table, method: "order", args: [column, options] });
        return Promise.resolve({
          data: db.reviewsError ? null : db.reviews,
          error: db.reviewsError,
        });
      },
      in(column: string, value: unknown) {
        db.calls.push({ table, method: "in", args: [column, value] });
        return Promise.resolve({
          data: db.profilesError ? null : db.profiles,
          error: db.profilesError,
        });
      },
    };
    return api;
  }

  return { supabase: { from: (table: string) => builder(table) } };
});

import { fetchProductReviews } from "@/lib/reviews";

const reviewRow = {
  id: "r1",
  product_id: "book-1",
  user_id: "user-1",
  rating: 5,
  title: "Great",
  comment: "Loved it",
  is_verified_purchase: false,
  helpful_count: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function reviewSelect(): string {
  const call = db.calls.find(
    (entry) => entry.table === "reviews" && entry.method === "select",
  );
  return String(call?.args[0] ?? "");
}

describe("fetchProductReviews", () => {
  beforeEach(() => {
    db.calls = [];
    db.reviews = [];
    db.reviewsError = null;
    db.profiles = [];
    db.profilesError = null;
  });

  it("selects only real review columns and does not embed profiles", async () => {
    await fetchProductReviews("book-1");

    const columns = reviewSelect()
      .split(",")
      .map((column) => column.trim())
      .filter(Boolean);
    expect(columns).toEqual(REVIEW_COLUMNS);
    expect(reviewSelect()).not.toMatch(
      /profiles|user_name|\bbody\b|approved|\*/,
    );
    expect(db.calls.some((call) => call.table === "profiles")).toBe(false);
  });

  it("loads display names from profiles without a reviews relationship", async () => {
    db.reviews = [reviewRow, { ...reviewRow, id: "r2", user_id: "user-2" }];
    db.profiles = [
      {
        id: "user-1",
        display_name: "Ada",
        avatar_url: "https://example.com/a.png",
      },
    ];

    const { data, error } = await fetchProductReviews("book-1");

    expect(error).toBeNull();
    expect(data?.[0].user).toEqual({
      display_name: "Ada",
      avatar_url: "https://example.com/a.png",
    });
    expect(data?.[1].user).toBeUndefined();
    expect(
      db.calls.find((call) => call.table === "profiles" && call.method === "in")
        ?.args,
    ).toEqual(["id", ["user-1", "user-2"]]);
  });

  it("leaves the review unnamed when the profiles read fails", async () => {
    db.reviews = [reviewRow];
    db.profilesError = { message: "unavailable" };

    const { data, error } = await fetchProductReviews("book-1");

    expect(error).toBeNull();
    expect(data?.[0].comment).toBe("Loved it");
    expect(data?.[0].user).toBeUndefined();
  });

  it("returns the reviews error without querying profiles", async () => {
    db.reviewsError = { message: "bad request" };

    const { data, error } = await fetchProductReviews("book-1");

    expect(data).toBeNull();
    expect(error).toEqual({ message: "bad request" });
    expect(db.calls.some((call) => call.table === "profiles")).toBe(false);
  });
});
