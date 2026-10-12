import { NextRequest, NextResponse } from "next/server";
import { unauthorizedJson, verifyReviewApiTokenHeader } from "@/lib/review/auth";
import { parseReviewSlug } from "@/lib/review/paths";
import { createReviewSupabase } from "@/lib/review/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  if (!verifyReviewApiTokenHeader(request.headers.get("x-review-token"))) {
    return unauthorizedJson("Invalid or missing x-review-token");
  }

  const { slug: rawSlug } = await context.params;
  const slug = parseReviewSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const supabase = createReviewSupabase();
  const { data: versions, error: listError } = await supabase
    .from("book_review_submissions")
    .select("version, created_at")
    .eq("book_slug", slug)
    .order("version", { ascending: false });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const versionRows = versions ?? [];
  const latestVersion = versionRows[0]?.version ?? 0;
  const requested = request.nextUrl.searchParams.get("version");
  const version =
    requested === null || requested === ""
      ? latestVersion
      : Number.parseInt(requested, 10);

  if (requested && !Number.isInteger(version)) {
    return NextResponse.json({ error: "version must be an integer" }, { status: 400 });
  }

  if (version === 0) {
    return NextResponse.json({
      slug,
      latest_version: 0,
      versions: [],
      submission: null,
    });
  }

  const { data: submission, error } = await supabase
    .from("book_review_submissions")
    .select("id, book_slug, version, payload, created_at")
    .eq("book_slug", slug)
    .eq("version", version)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!submission) {
    return NextResponse.json(
      {
        slug,
        latest_version: latestVersion,
        versions: versionRows,
        error: `No submission for version ${version}`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    slug,
    latest_version: latestVersion,
    versions: versionRows,
    submission,
  });
}
