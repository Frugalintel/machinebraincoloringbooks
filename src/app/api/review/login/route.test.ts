import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/review/login/route";
import { createReviewSupabase } from "@/lib/review/supabase";

const { countRecentLoginFailures, countRecentGlobalLoginFailures } = vi.hoisted(
  () => ({
    countRecentLoginFailures: vi.fn(),
    countRecentGlobalLoginFailures: vi.fn(),
  }),
);

vi.mock("@/lib/review/login-rate-limit", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/review/login-rate-limit")>();
  return {
    ...actual,
    countRecentLoginFailures,
    countRecentGlobalLoginFailures,
  };
});

vi.mock("@/lib/review/supabase", () => ({
  createReviewSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        lt: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));

function createSupabaseMock(options?: {
  deleteResult?: Promise<{ error: { message: string } | null }>;
  deleteThrows?: Error;
}) {
  const lt = options?.deleteThrows
    ? vi.fn().mockRejectedValue(options.deleteThrows)
    : vi
        .fn()
        .mockImplementation(
          () => options?.deleteResult ?? Promise.resolve({ error: null }),
        );
  const del = vi.fn(() => ({ lt }));
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => ({
    insert,
    delete: del,
  }));

  return { from, delete: del, lt, insert };
}

describe("POST /api/review/login lockout", () => {
  const previousPassword = process.env.REVIEW_PASSWORD;

  beforeEach(() => {
    process.env.REVIEW_PASSWORD = "unit-test-review-password";
    countRecentLoginFailures.mockReset();
    countRecentGlobalLoginFailures.mockReset();
    countRecentLoginFailures.mockResolvedValue(5);
    countRecentGlobalLoginFailures.mockResolvedValue(0);
  });

  afterEach(() => {
    if (previousPassword === undefined) {
      delete process.env.REVIEW_PASSWORD;
    } else {
      process.env.REVIEW_PASSWORD = previousPassword;
    }
  });

  it("returns 429 JSON with Retry-After for fetch/JSON clients", async () => {
    const request = new NextRequest("http://localhost/api/review/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: "incorrect",
        next: "/review/demo-book",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    await expect(response.json()).resolves.toEqual({
      error: "Too many failed login attempts. Try again in 15 minutes.",
    });
  });

  it("redirects HTML form posts to ?error=locked instead of raw JSON", async () => {
    const request = new NextRequest("http://localhost/api/review/login", {
      method: "POST",
      headers: {
        Accept: "text/html",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "password=incorrect&next=/review/demo-book",
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/review/demo-book?error=locked",
    );
    expect(response.headers.get("Retry-After")).toBe("900");
  });

  it("also redirects when the global failure cap is hit on a form post", async () => {
    countRecentLoginFailures.mockResolvedValue(0);
    countRecentGlobalLoginFailures.mockResolvedValue(50);

    const request = new NextRequest("http://localhost/api/review/login", {
      method: "POST",
      headers: {
        Accept: "text/html",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "password=incorrect&next=/review/demo-book",
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("error=locked");
  });
});

describe("POST /api/review/login cleanup", () => {
  const originalPassword = process.env.REVIEW_PASSWORD;

  beforeEach(() => {
    process.env.REVIEW_PASSWORD = "review-pass";
    countRecentLoginFailures.mockReset();
    countRecentGlobalLoginFailures.mockReset();
    countRecentLoginFailures.mockResolvedValue(0);
    countRecentGlobalLoginFailures.mockResolvedValue(0);
  });

  afterEach(() => {
    process.env.REVIEW_PASSWORD = originalPassword;
    vi.clearAllMocks();
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
    errorSpy.mockRestore();
  });

  it("still returns 200 when cleanup returns an error", async () => {
    const supabase = createSupabaseMock({
      deleteResult: Promise.resolve({ error: { message: "delete failed" } }),
    });
    vi.mocked(createReviewSupabase).mockReturnValue(supabase as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new NextRequest("http://localhost/api/review/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: "review-pass" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    errorSpy.mockRestore();
  });
});
