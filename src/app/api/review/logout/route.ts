import { NextRequest, NextResponse } from "next/server";
import { clearReviewCookie } from "@/lib/review/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNextPath(value: string | null): string {
  if (value && value.startsWith("/review") && !value.startsWith("//")) {
    return value;
  }
  return "/review";
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let nextPath = request.nextUrl.searchParams.get("next");
  if (contentType.includes("form")) {
    const form = await request.formData();
    nextPath = String(form.get("next") ?? nextPath ?? "");
  }
  const safeNext = safeNextPath(nextPath);
  const accept = request.headers.get("accept") ?? "";
  const response = accept.includes("application/json")
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL(safeNext, request.url), 303);
  clearReviewCookie(response);
  return response;
}
