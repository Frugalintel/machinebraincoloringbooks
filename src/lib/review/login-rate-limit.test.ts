import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clientIpFromRequest,
  deleteOldLoginAttempts,
  hashLoginIp,
  isOverLoginFailureLimit,
  loginAttemptRetentionCutoff,
} from "@/lib/review/login-rate-limit";

describe("review login rate limit", () => {
  it("hashes IPs with HMAC so raw addresses are not stored", () => {
    const hash = hashLoginIp("203.0.113.9", "review-pass");
    expect(hash).not.toContain("203.0.113.9");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashLoginIp("203.0.113.9", "review-pass")).toBe(hash);
    expect(hashLoginIp("203.0.113.9", "other-pass")).not.toBe(hash);
  });

  it("reads the first forwarded IP", () => {
    const request = new NextRequest("http://localhost/api/review/login", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(clientIpFromRequest(request)).toBe("203.0.113.9");
  });

  it("blocks the sixth failure in the window", () => {
    expect(isOverLoginFailureLimit(4)).toBe(false);
    expect(isOverLoginFailureLimit(5)).toBe(true);
  });
});

describe("deleteOldLoginAttempts", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("deletes rows older than one day via attempted_at", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T20:48:00.000Z"));

    const lt = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ lt }));
    const from = vi.fn(() => ({ delete: del }));

    await deleteOldLoginAttempts({ from } as unknown as SupabaseClient);

    expect(from).toHaveBeenCalledWith("book_review_login_attempts");
    expect(del).toHaveBeenCalledTimes(1);
    expect(lt).toHaveBeenCalledWith(
      "attempted_at",
      loginAttemptRetentionCutoff(),
    );
    expect(lt).toHaveBeenCalledWith("attempted_at", "2026-10-11T20:48:00.000Z");
  });

  it("throws when the delete returns an error", async () => {
    const lt = vi
      .fn()
      .mockResolvedValue({ error: { message: "delete failed" } });
    const from = vi.fn(() => ({ delete: () => ({ lt }) }));

    await expect(
      deleteOldLoginAttempts({ from } as unknown as SupabaseClient),
    ).rejects.toThrow("delete failed");
  });
});
