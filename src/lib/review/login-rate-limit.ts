import { createHmac } from "node:crypto";
import { isIPv4 } from "node:net";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  REVIEW_LOGIN_GLOBAL_MAX_FAILURES,
  REVIEW_LOGIN_MAX_FAILURES,
  REVIEW_LOGIN_WINDOW_MS,
} from "@/lib/review/constants";

function unwrapIp(ip: string): string {
  const trimmed = ip.trim();
  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    return trimmed.slice(1, trimmed.indexOf("]"));
  }
  return trimmed;
}

function stripZoneId(ip: string): string {
  const zone = ip.indexOf("%");
  return zone === -1 ? ip : ip.slice(0, zone);
}

function replaceDottedIPv4Tail(ip: string): string {
  const lastColon = ip.lastIndexOf(":");
  if (lastColon === -1) {
    return ip;
  }
  const tail = ip.slice(lastColon + 1);
  if (!isIPv4(tail)) {
    return ip;
  }
  const octets = tail.split(".").map(Number);
  const hi = ((octets[0] << 8) | octets[1]).toString(16);
  const lo = ((octets[2] << 8) | octets[3]).toString(16);
  return `${ip.slice(0, lastColon + 1)}${hi}:${lo}`;
}

function parseIPv6Hextets(ip: string): number[] | null {
  const value = replaceDottedIPv4Tail(stripZoneId(unwrapIp(ip)).toLowerCase());
  if ((value.match(/::/g) ?? []).length > 1) {
    return null;
  }

  let groups: string[];
  if (value.includes("::")) {
    const [left, right] = value.split("::");
    const leftGroups = left === "" ? [] : left.split(":");
    const rightGroups = right === "" ? [] : right.split(":");
    if (
      leftGroups.some((group) => group === "") ||
      rightGroups.some((group) => group === "")
    ) {
      return null;
    }
    const missing = 8 - leftGroups.length - rightGroups.length;
    if (missing <= 0) {
      return null;
    }
    groups = [
      ...leftGroups,
      ...Array<string>(missing).fill("0"),
      ...rightGroups,
    ];
  } else {
    groups = value.split(":");
  }

  if (groups.length !== 8) {
    return null;
  }

  const hextets: number[] = [];
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) {
      return null;
    }
    hextets.push(parseInt(group, 16));
  }
  return hextets;
}

function isIPv4Mapped(hextets: number[]): boolean {
  return (
    hextets[0] === 0 &&
    hextets[1] === 0 &&
    hextets[2] === 0 &&
    hextets[3] === 0 &&
    hextets[4] === 0 &&
    hextets[5] === 0xffff
  );
}

function ipv4FromHextets(high: number, low: number): string {
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

export function normalizeClientIp(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed || trimmed === "unknown") {
    return trimmed || "unknown";
  }

  const bare = stripZoneId(unwrapIp(trimmed));
  if (isIPv4(bare)) {
    return bare;
  }

  const hextets = parseIPv6Hextets(trimmed);
  if (!hextets) {
    return trimmed;
  }
  if (isIPv4Mapped(hextets)) {
    return ipv4FromHextets(hextets[6], hextets[7]);
  }
  return `${hextets[0].toString(16)}:${hextets[1].toString(16)}:${hextets[2].toString(16)}:${hextets[3].toString(16)}::`;
}

export function clientIpFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return normalizeClientIp(first);
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return normalizeClientIp(realIp);
  }
  return "unknown";
}

export function hashLoginIp(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export function loginAttemptCutoff(now = Date.now()): string {
  return new Date(now - REVIEW_LOGIN_WINDOW_MS).toISOString();
}

export async function countRecentLoginFailures(
  supabase: SupabaseClient,
  ipHash: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("book_review_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("attempted_at", loginAttemptCutoff());
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function countRecentGlobalLoginFailures(
  supabase: SupabaseClient,
): Promise<number> {
  const { count, error } = await supabase
    .from("book_review_login_attempts")
    .select("id", { count: "exact", head: true })
    .gte("attempted_at", loginAttemptCutoff());
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function recordLoginFailure(
  supabase: SupabaseClient,
  ipHash: string,
): Promise<void> {
  const { error } = await supabase.from("book_review_login_attempts").insert({
    ip_hash: ipHash,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export function isOverLoginFailureLimit(count: number): boolean {
  return count >= REVIEW_LOGIN_MAX_FAILURES;
}

export function isOverGlobalLoginFailureLimit(count: number): boolean {
  return count >= REVIEW_LOGIN_GLOBAL_MAX_FAILURES;
}

export function shouldBlockLoginAttempts(
  perKeyFailures: number,
  globalFailures: number,
): boolean {
  return (
    isOverLoginFailureLimit(perKeyFailures) ||
    isOverGlobalLoginFailureLimit(globalFailures)
  );
}

const LOGIN_ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

export function loginAttemptRetentionCutoff(now = Date.now()): string {
  return new Date(now - LOGIN_ATTEMPT_RETENTION_MS).toISOString();
}

export async function deleteOldLoginAttempts(
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase
    .from("book_review_login_attempts")
    .delete()
    .lt("attempted_at", loginAttemptRetentionCutoff());
  if (error) {
    throw new Error(error.message);
  }
}
