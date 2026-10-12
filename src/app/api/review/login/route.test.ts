import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/review/login/route";
import { createReviewSupabase } from "@/lib/review/supabase";

vi.mock("@/lib/review/supabase", () => ({
  createReviewSupabase: vi.fn(),
}));

function createSupabaseMock(options?: {
  deleteResult?: Promise<{ error: { message: string } | null }>;
  deleteThrows?: Error;
  failureCount?: number;
}) {
  const lt = options?.deleteThrows
    ? vi.fn().mockRejectedValue(options.deleteThrows)
    : vi
        .fn()
        .mockImplementation(
          () => options?.deleteResult ?? Promise.resolve({ error: null }),
        );
  const del = vi.fn(() => ({ lt }));
  const gte = vi.fn().mockResolvedValue({
    count: options?.failureCount ?? 0,
    error: null,
  });
  const eq = vi.fn(() => ({ gte }));
  const select = vi.fn(() => ({ eq, gte }));
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => ({
    select,
    insert,
    delete: del,
  }));

  return { from, delete: del, lt, insert };
}

describe("POST /api/review/login cleanup", () => {
  const originalPassword = process.env.REVIEW_PASSWORD;

  beforeEach(() => {
    process.env.REVIEW_PASSWORD = "review-pass";
  });

  afterEach(() => {
    process.env.REVIEW_PASSWORD = originalPassword;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("deletes login attempts older than one day on each attempt", async () => {
    const supabase = createSupabaseMock();
    vi.mocked(createReviewSupabase).mockReturnValue(supabase as never);

    const response = await POST(
      new NextRequest("http://localhost/api/review/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: "wrong" }),
      }),
    );

    expect(supabase.from).toHaveBeenCalledWith("book_review_login_attempts");
    expect(supabase.delete).toHaveBeenCalledTimes(1);
    expect(supabase.lt).toHaveBeenCalledTimes(1);
    expect(supabase.lt.mock.calls[0]?.[0]).toBe("attempted_at");
    const cutoff = Date.parse(String(supabase.lt.mock.calls[0]?.[1]));
    expect(Number.isNaN(cutoff)).toBe(false);
    expect(Date.now() - cutoff).toBeGreaterThanOrEqual(
      24 * 60 * 60 * 1000 - 5_000,
    );
    expect(Date.now() - cutoff).toBeLessThanOrEqual(
      24 * 60 * 60 * 1000 + 5_000,
    );
    expect(response.status).toBe(401);
  });

  it("still returns 401 when cleanup throws", async () => {
    const supabase = createSupabaseMock({
      deleteThrows: new Error("cleanup unavailable"),
    });
    vi.mocked(createReviewSupabase).mockReturnValue(supabase as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new NextRequest("http://localhost/api/review/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: "wrong" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid password" });
    expect(errorSpy).toHaveBeenCalled();
    const [message, detail] = errorSpy.mock.calls[0] ?? [];
    expect(message).toBe("Failed to clean up old book review login attempts");
    expect(detail).toBe("cleanup unavailable");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toMatch(/SERVICE_ROLE|eyJ/);
  });

  it("still returns 200 when cleanup returns an error", async () => {
    const supabase = createSupabaseMock({
      deleteResult: Promise.resolve({ error: { message: "delete failed" } }),
    });
    vi.mocked(createReviewSupabase).mockReturnValue(supabase as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new NextRequest("http://localhost/api/review/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: "review-pass" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
