import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  publishedCount: 0 as number | null,
  countError: null as { message: string } | null,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: (_columns: string, options?: { head?: boolean }) => {
        if (options?.head) {
          return {
            eq: async () => ({
              count: db.publishedCount,
              error: db.countError,
            }),
          };
        }
        return {
          eq: () => ({
            single: async () =>
              db.row
                ? { data: db.row, error: null }
                : { data: null, error: { code: "22P02" } },
          }),
        };
      },
    }),
  }),
}));

import { fetchProductById } from "@/lib/product-lookup";

const ENV = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

describe("fetchProductById", () => {
  beforeEach(() => {
    vi.stubEnv(ENV[0], "http://127.0.0.1:1");
    vi.stubEnv(ENV[1], "not-a-key");
    db.row = null;
    db.publishedCount = 0;
    db.countError = null;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves the fallback catalog's /store/1 link when the live catalog is empty", async () => {
    expect((await fetchProductById("1"))?.subtitle).toBe("Vacuum Pups");
  });

  it("resolves it when the live catalog errors, as the listing would fall back too", async () => {
    db.publishedCount = null;
    db.countError = { message: "down" };
    expect((await fetchProductById("1"))?.id).toBe("1");
  });

  it("resolves it with no database configured", async () => {
    vi.stubEnv(ENV[0], "");
    expect((await fetchProductById("1"))?.id).toBe("1");
  });

  it("keeps local ids a 404 while the live catalog is up, so prod never sells a placeholder", async () => {
    db.publishedCount = 9;
    expect(await fetchProductById("1")).toBeNull();
  });

  it("returns null for ids in neither catalog", async () => {
    expect(await fetchProductById("missing")).toBeNull();
  });

  it("reads spec columns safely and never leaks raw nulls", async () => {
    db.row = {
      id: "u1",
      title: "FANTASY",
      subtitle: "Realm Walker",
      discount_percent: null,
      is_published: true,
      image_url: null,
      page_count: "48",
      trim_width_in: null,
      paper: null,
    };
    const product = await fetchProductById("u1");
    expect(product).toMatchObject({ page_count: 48, discount_percent: 0 });
    expect(product).not.toHaveProperty("trim_width_in");
    expect(product).not.toHaveProperty("paper");
    expect(product?.image_url).toBeUndefined();
  });
});
