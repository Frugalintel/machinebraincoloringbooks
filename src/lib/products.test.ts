import { describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => [] as [string, unknown][]);

vi.mock("@/lib/supabase", () => {
  const query = {
    select: (...args: unknown[]) => (calls.push(["select", args]), query),
    eq: (...args: unknown[]) => (calls.push(["eq", args]), query),
    order: (...args: unknown[]) => (calls.push(["order", args]), query),
    limit: (...args: unknown[]) => (calls.push(["limit", args]), query),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: [], error: null }),
  };
  return { supabase: { from: () => query } };
});

import { fetchPublishedProducts } from "@/lib/products";

describe("fetchPublishedProducts", () => {
  it("breaks created_at ties on id so books that share a timestamp keep one order", async () => {
    await fetchPublishedProducts();
    expect(calls.filter(([name]) => name === "order")).toEqual([
      ["order", ["created_at", { ascending: false }]],
      ["order", ["id", { ascending: true }]],
    ]);
  });
});
