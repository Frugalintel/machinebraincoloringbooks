import { NextRequest, NextResponse } from "next/server";
import {
  applyReviewCookie,
  getReviewPassword,
  verifyReviewPassword,
} from "@/lib/review/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNextPath(value: string | null): string {
  if (value && value.startsWith("/review/") && !value.startsWith("//")) {
    return value;
  }
  return "/review";
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

  if (!verifyReviewPassword(submitted, password)) {
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
