import type { SupabaseClient } from "@supabase/supabase-js";
import {
  REVIEW_BUCKET,
  REVIEW_SIGNED_URL_BATCH,
  REVIEW_SIGNED_URL_TTL,
} from "@/lib/review/constants";

export async function createSignedUrlMap(
  supabase: SupabaseClient,
  paths: string[],
  expiresIn = REVIEW_SIGNED_URL_TTL,
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const signed: Record<string, string> = {};
  for (let i = 0; i < unique.length; i += REVIEW_SIGNED_URL_BATCH) {
    const batch = unique.slice(i, i + REVIEW_SIGNED_URL_BATCH);
    const { data, error } = await supabase.storage
      .from(REVIEW_BUCKET)
      .createSignedUrls(batch, expiresIn);
    if (error) {
      throw new Error(`Failed to sign storage URLs: ${error.message}`);
    }
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) {
        signed[item.path] = item.signedUrl;
      }
    }
  }
  return signed;
}

export async function downloadBucketText(
  supabase: SupabaseClient,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(REVIEW_BUCKET)
    .download(path);
  if (error || !data) {
    throw new Error(
      `Failed to download ${path}: ${error?.message ?? "missing object"}`,
    );
  }
  return data.text();
}
