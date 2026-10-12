import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  REVIEW_LOGIN_MAX_FAILURES,
  REVIEW_LOGIN_WINDOW_MS,
} from "@/lib/review/constants";

export function clientIpFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
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
