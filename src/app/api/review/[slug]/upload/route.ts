import { NextRequest, NextResponse } from "next/server";
import { isReviewCookieValid, unauthorizedJson } from "@/lib/review/auth";
import {
  REVIEW_BUCKET,
  REVIEW_IMAGE_MIME,
  REVIEW_UPLOAD_MAX_BYTES,
} from "@/lib/review/constants";
import { parseReviewSlug, uploadPathForSlug } from "@/lib/review/paths";
import { createSignedUrlMap } from "@/lib/review/signed-urls";
import { createReviewSupabase } from "@/lib/review/supabase";

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

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > REVIEW_UPLOAD_MAX_BYTES) {
    return NextResponse.json({ error: "File is too large" }, { status: 413 });
  }
  if (!REVIEW_IMAGE_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Only image uploads are allowed" },
      { status: 400 },
    );
  }

  const path = uploadPathForSlug(slug, file.name);
  const supabase = createReviewSupabase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from(REVIEW_BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const signed = await createSignedUrlMap(supabase, [path]);
  return NextResponse.json({
    path,
    signedUrl: signed[path] ?? null,
  });
}
