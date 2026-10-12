import { NextRequest, NextResponse } from "next/server";
import { isReviewCookieValid, unauthorizedJson } from "@/lib/review/auth";
import { parseReviewSlug } from "@/lib/review/paths";
import { insertSubmissionWithRetry } from "@/lib/review/submit";
import { createReviewSupabase } from "@/lib/review/supabase";
import type { ReviewDraft } from "@/lib/review/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
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

  let draft: ReviewDraft;
  try {
    draft = (await request.json()) as ReviewDraft;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!draft || !Array.isArray(draft.order)) {
    return NextResponse.json(
      { error: "payload.order is required" },
      { status: 400 },
    );
  }

  const result = await insertSubmissionWithRetry(
    createReviewSupabase(),
    slug,
    draft,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    submission: result.submission,
    payload: result.payload,
  });
}
