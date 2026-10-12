import { NextRequest, NextResponse } from "next/server";
import { isReviewCookieValid, unauthorizedJson } from "@/lib/review/auth";
import { buildSubmissionPayload } from "@/lib/review/payload";
import { parseReviewSlug } from "@/lib/review/paths";
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
    return NextResponse.json({ error: "payload.order is required" }, { status: 400 });
  }

  const supabase = createReviewSupabase();
  const { data: latest, error: latestError } = await supabase
    .from("book_review_submissions")
    .select("version")
    .eq("book_slug", slug)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return NextResponse.json(
      { error: latestError.message },
      { status: 500 },
    );
  }

  const version = (latest?.version ?? 0) + 1;
  const payload = buildSubmissionPayload(draft);
  const { data, error } = await supabase
    .from("book_review_submissions")
    .insert({
      book_slug: slug,
      version,
      payload,
    })
    .select("id, book_slug, version, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submission: data, payload });
}
