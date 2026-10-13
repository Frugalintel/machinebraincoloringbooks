import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/review/login/route";

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
  createReviewSupabase: () => ({ from: vi.fn() }),
}));

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
