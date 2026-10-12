import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSubmissionPayload } from "@/lib/review/payload";
import type { ReviewDraft, ReviewSubmissionPayload } from "@/lib/review/types";

const UNIQUE_VIOLATION = "23505";
const MAX_INSERT_TRIES = 3;

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === UNIQUE_VIOLATION;
}

export type SubmissionInsert = {
  id: string;
  book_slug: string;
  version: number;
  created_at: string;
};

export async function insertSubmissionWithRetry(
  supabase: SupabaseClient,
  slug: string,
  draft: ReviewDraft,
): Promise<
  | { ok: true; submission: SubmissionInsert; payload: ReviewSubmissionPayload }
  | { ok: false; error: string; status: number }
> {
  const payload = buildSubmissionPayload(draft);
  let lastError = "Failed to save submission";

  for (let attempt = 0; attempt < MAX_INSERT_TRIES; attempt += 1) {
    const { data: latest, error: latestError } = await supabase
      .from("book_review_submissions")
      .select("version")
      .eq("book_slug", slug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      return { ok: false, error: latestError.message, status: 500 };
    }

    const version = (latest?.version ?? 0) + 1;
    const { data, error } = await supabase
      .from("book_review_submissions")
      .insert({
        book_slug: slug,
        version,
        payload,
      })
      .select("id, book_slug, version, created_at")
      .single();

    if (!error && data) {
      return { ok: true, submission: data, payload };
    }
    if (!isUniqueViolation(error)) {
      return { ok: false, error: error?.message ?? lastError, status: 500 };
    }
    lastError = error.message;
  }

  return { ok: false, error: lastError, status: 409 };
}
