import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  isPublicReviewApi,
  isReviewPath,
  signReviewCookie,
  timingSafeEqualString,
  verifyReviewCookie,
  verifyReviewPassword,
} from "@/lib/review/auth";

describe("review auth", () => {
  it("compares strings in a length-independent way", () => {
    expect(timingSafeEqualString("alpha", "alpha")).toBe(true);
    expect(timingSafeEqualString("alpha", "beta")).toBe(false);
    expect(timingSafeEqualString("short", "much-longer")).toBe(false);
  });

  it("accepts the review password only when it matches", () => {
    expect(verifyReviewPassword("secret", "secret")).toBe(true);
    expect(verifyReviewPassword("secret", "other")).toBe(false);
  });

  it("signs and verifies the HMAC cookie", () => {
    const token = signReviewCookie("review-pass");
    expect(verifyReviewCookie(token, "review-pass")).toBe(true);
    expect(verifyReviewCookie(token, "wrong-pass")).toBe(false);
    expect(verifyReviewCookie(undefined, "review-pass")).toBe(false);
    expect(verifyReviewCookie("tampered", "review-pass")).toBe(false);
  });

  it("treats login, logout, and token reads as public APIs", () => {
    expect(isReviewPath("/review/ottoline-garden")).toBe(true);
    expect(isReviewPath("/api/review/login")).toBe(true);
    expect(isReviewPath("/store")).toBe(false);
    expect(
      isPublicReviewApi(
        new NextRequest("http://localhost/api/review/login", { method: "POST" }),
      ),
    ).toBe(true);
    expect(
      isPublicReviewApi(
        new NextRequest("http://localhost/api/review/demo/submissions", {
          method: "GET",
        }),
      ),
    ).toBe(true);
    expect(
      isPublicReviewApi(
        new NextRequest("http://localhost/api/review/demo", { method: "GET" }),
      ),
    ).toBe(false);
  });
});
