import { NextRequest, NextResponse } from "next/server";
import {
  applyReviewCookie,
  getReviewPassword,
  verifyReviewPassword,
} from "@/lib/review/auth";
import { REVIEW_LOGIN_WINDOW_MS } from "@/lib/review/constants";
import { prefersHtmlLoginError } from "@/lib/review/login-errors";
import {
  clientIpFromRequest,
  countRecentGlobalLoginFailures,
  countRecentLoginFailures,
  hashLoginIp,
  recordLoginFailure,
  shouldBlockLoginAttempts,
} from "@/lib/review/login-rate-limit";
import { createReviewSupabase } from "@/lib/review/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNextPath(value: string | null): string {
  if (value && value.startsWith("/review/") && !value.startsWith("//")) {
    return value;
  }
  return "/review";
}

function rateLimitedResponse(request: NextRequest, nextPath: string) {
  const retryAfter = Math.ceil(REVIEW_LOGIN_WINDOW_MS / 1000);
  const headers = { "Retry-After": String(retryAfter) };
  if (prefersHtmlLoginError(request)) {
    const url = new URL(nextPath, request.url);
    url.searchParams.set("error", "locked");
    const response = NextResponse.redirect(url, 303);
    response.headers.set("Retry-After", String(retryAfter));
    return response;
  }
  return NextResponse.json(
    {
      error: `Too many failed login attempts. Try again in ${Math.ceil(REVIEW_LOGIN_WINDOW_MS / 60000)} minutes.`,
    },
    {
      status: 429,
      headers,
    },
  );
}

export async function POST(request: NextRequest) {
  const password = getReviewPassword();
  if (!password) {
    return NextResponse.json(
      { error: "REVIEW_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let submitted = "";
  let nextPath = "/review";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      password?: string;
      next?: string;
    };
    submitted = typeof body.password === "string" ? body.password : "";
    nextPath = safeNextPath(body.next ?? null);
  } else {
    const form = await request.formData();
    submitted = String(form.get("password") ?? "");
    nextPath = safeNextPath(String(form.get("next") ?? ""));
  }

  const ipHash = hashLoginIp(clientIpFromRequest(request), password);
  let supabase: ReturnType<typeof createReviewSupabase>;
  try {
    supabase = createReviewSupabase();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Supabase is not configured",
      },
      { status: 500 },
    );
  }

  try {
    const [failures, globalFailures] = await Promise.all([
      countRecentLoginFailures(supabase, ipHash),
      countRecentGlobalLoginFailures(supabase),
    ]);
    if (shouldBlockLoginAttempts(failures, globalFailures)) {
      return rateLimitedResponse(request, nextPath);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check login rate limit",
      },
      { status: 500 },
    );
  }

  if (!verifyReviewPassword(submitted, password)) {
    try {
      await recordLoginFailure(supabase, ipHash);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to record login attempt",
        },
        { status: 500 },
      );
    }
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const url = new URL(nextPath, request.url);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, 303);
  }

  if (contentType.includes("application/json")) {
    const response = NextResponse.json({ ok: true });
    applyReviewCookie(response, password);
    return response;
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  applyReviewCookie(response, password);
  return response;
}
