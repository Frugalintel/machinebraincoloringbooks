import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  clientIpFromRequest,
  hashLoginIp,
  isOverLoginFailureLimit,
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
