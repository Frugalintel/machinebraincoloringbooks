import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  REVIEW_COOKIE_MAX_AGE,
  REVIEW_COOKIE_NAME,
  REVIEW_COOKIE_PAYLOAD,
} from "@/lib/review/constants";

export function timingSafeEqualString(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function signReviewCookie(password: string): string {
  return createHmac("sha256", password)
    .update(REVIEW_COOKIE_PAYLOAD)
    .digest("base64url");
}

export function verifyReviewCookie(
  value: string | undefined,
  password: string,
): boolean {
  if (!value) {
    return false;
  }
  return timingSafeEqualString(value, signReviewCookie(password));
}

export function verifyReviewPassword(
  input: string,
  expected: string,
): boolean {
  return timingSafeEqualString(input, expected);
}

export function getReviewPassword(): string | undefined {
  const password = process.env.REVIEW_PASSWORD;
  return password ? password : undefined;
}

export function getReviewApiToken(): string | undefined {
  const token = process.env.REVIEW_API_TOKEN;
  return token ? token : undefined;
}

export function isReviewCookieValid(request: NextRequest): boolean {
  const password = getReviewPassword();
  if (!password) {
    return false;
  }
  return verifyReviewCookie(
    request.cookies.get(REVIEW_COOKIE_NAME)?.value,
    password,
  );
}

export function verifyReviewApiTokenHeader(
  header: string | null,
): boolean {
  const expected = getReviewApiToken();
  if (!expected || !header) {
    return false;
  }
  return timingSafeEqualString(header, expected);
}

export function reviewCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REVIEW_COOKIE_MAX_AGE,
  };
}

export function applyReviewCookie(response: NextResponse, password: string) {
  response.cookies.set(
    REVIEW_COOKIE_NAME,
    signReviewCookie(password),
    reviewCookieOptions(),
  );
}

export function clearReviewCookie(response: NextResponse) {
  response.cookies.set(REVIEW_COOKIE_NAME, "", {
    ...reviewCookieOptions(),
    maxAge: 0,
  });
}

export function isPublicReviewApi(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/review/login" || pathname === "/api/review/logout") {
    return true;
  }
  if (
    request.method === "GET" &&
    /^\/api\/review\/[^/]+\/submissions\/?$/.test(pathname)
  ) {
    return true;
  }
  return false;
}

export function isReviewPath(pathname: string): boolean {
  return pathname.startsWith("/review/") || pathname.startsWith("/api/review/");
}

export function unauthorizedJson(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
