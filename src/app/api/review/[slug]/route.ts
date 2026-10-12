import { NextRequest, NextResponse } from "next/server";
import { isReviewCookieValid, unauthorizedJson } from "@/lib/review/auth";
import { loadReviewBook } from "@/lib/review/book";
import { parseReviewSlug } from "@/lib/review/paths";
import { createReviewSupabase } from "@/lib/review/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  if (!isReviewCookieValid(request)) {
    return unauthorizedJson();
  }
  const { slug: rawSlug } = await context.params;
  const slug = parseReviewSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  try {
    const book = await loadReviewBook(createReviewSupabase(), slug);
    return NextResponse.json(book);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load book";
    const status = message.includes("missing object") || message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
