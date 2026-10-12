import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  clientIpFromRequest,
  hashLoginIp,
  isOverGlobalLoginFailureLimit,
  isOverLoginFailureLimit,
  normalizeClientIp,
  shouldBlockLoginAttempts,
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

describe("normalizeClientIp", () => {
  it("leaves IPv4 addresses unchanged", () => {
    expect(normalizeClientIp("203.0.113.9")).toBe("203.0.113.9");
  });

  it("reduces a full IPv6 address to its /64 prefix", () => {
    expect(normalizeClientIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      "2001:db8:85a3:0::",
    );
  });

  it("expands compressed IPv6 before taking the /64 prefix", () => {
    expect(normalizeClientIp("2001:db8:85a3::8a2e:370:7334")).toBe(
      "2001:db8:85a3:0::",
    );
    expect(normalizeClientIp("2001:db8:abcd:12::1")).toBe("2001:db8:abcd:12::");
  });

  it("treats IPv4-mapped IPv6 as IPv4", () => {
    expect(normalizeClientIp("::ffff:192.0.2.1")).toBe("192.0.2.1");
    expect(normalizeClientIp("::FFFF:192.0.2.1")).toBe("192.0.2.1");
    expect(normalizeClientIp("0:0:0:0:0:ffff:c000:201")).toBe("192.0.2.1");
  });

  it("groups rotating IPv6 interface IDs on the same /64", () => {
    expect(normalizeClientIp("2001:db8:abcd:12:1111:2222:3333:4444")).toBe(
      normalizeClientIp("2001:db8:abcd:12:aaaa:bbbb:cccc:dddd"),
    );
    expect(normalizeClientIp("2001:db8:abcd:12:1111:2222:3333:4444")).toBe(
      "2001:db8:abcd:12::",
    );
  });

  it("leaves unknown client markers unchanged", () => {
    expect(normalizeClientIp("unknown")).toBe("unknown");
  });
});

describe("clientIpFromRequest IPv6 normalization", () => {
  it("normalizes a forwarded IPv6 address to /64", () => {
    const request = new NextRequest("http://localhost/api/review/login", {
      headers: {
        "x-forwarded-for": "2001:db8:1:2:aaaa:bbbb:cccc:dddd, 10.0.0.1",
      },
    });
    expect(clientIpFromRequest(request)).toBe("2001:db8:1:2::");
  });

  it("hashes the same /64 to the same ip_hash after request extraction", () => {
    const secret = "review-pass";
    const first = new NextRequest("http://localhost/api/review/login", {
      headers: { "x-forwarded-for": "2001:db8:1:2:aaaa::1" },
    });
    const second = new NextRequest("http://localhost/api/review/login", {
      headers: { "x-real-ip": "2001:db8:1:2:bbbb::2" },
    });
    expect(hashLoginIp(clientIpFromRequest(first), secret)).toBe(
      hashLoginIp(clientIpFromRequest(second), secret),
    );
  });
});

describe("global login failure cap", () => {
  it("blocks every login once 50 failures land in the window", () => {
    expect(isOverGlobalLoginFailureLimit(49)).toBe(false);
    expect(isOverGlobalLoginFailureLimit(50)).toBe(true);
  });

  it("blocks when either the per-key or global cap is reached", () => {
    expect(shouldBlockLoginAttempts(4, 49)).toBe(false);
    expect(shouldBlockLoginAttempts(5, 0)).toBe(true);
    expect(shouldBlockLoginAttempts(0, 50)).toBe(true);
    expect(shouldBlockLoginAttempts(5, 50)).toBe(true);
  });
});
