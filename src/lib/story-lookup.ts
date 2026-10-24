import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Read-only existence check for a published story.
 * Returns null when the row is missing, unpublished, or Supabase is unset.
 * Does not write.
 */
export async function listPublishedStoryIds(): Promise<string[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("stories")
      .select("id")
      .eq("is_published", true);
    if (error || !data) return [];
    return data.flatMap((row) => (row.id ? [row.id] : []));
  } catch {
    return [];
  }
}

export const fetchPublishedStory = cache(async function fetchPublishedStory(
  id: string,
): Promise<{ id: string; title: string } | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("stories")
      .select("id, title")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !data?.id) return null;
    return {
      id: data.id,
      title: typeof data.title === "string" ? data.title : "Story",
    };
  } catch {
    return null;
  }
});
