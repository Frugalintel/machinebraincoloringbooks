import { NextRequest, NextResponse } from "next/server";
import { isReviewCookieValid, unauthorizedJson } from "@/lib/review/auth";
import { REVIEW_BUCKET, REVIEW_UPLOAD_MAX_BYTES } from "@/lib/review/constants";
import {
  detectAllowedImageType,
  isDisallowedDeclaredImageType,
} from "@/lib/review/image";
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
  if (isDisallowedDeclaredImageType(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, and WebP uploads are allowed" },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedType = detectAllowedImageType(bytes);
  if (!detectedType) {
    return NextResponse.json(
      { error: "File is not a valid PNG, JPEG, or WebP image" },
      { status: 400 },
    );
  }

  const path = uploadPathForSlug(slug, file.name);
  const supabase = createReviewSupabase();
  const { error } = await supabase.storage
    .from(REVIEW_BUCKET)
    .upload(path, bytes, {
      contentType: detectedType,
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
