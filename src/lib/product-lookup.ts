import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BOOK_SPEC_KEYS, readBookSpecs } from "@/lib/book-specs";
import { getProductById } from "@/lib/store-data";
import type { Product } from "@/lib/types";

/**
 * The listing falls back to the local catalog when live products are
 * unreachable or empty, so its links must resolve in exactly that case.
 * With a live catalog, local ids stay 404s so prod never sells a placeholder.
 */
async function liveCatalogAvailable(supabase: SupabaseClient) {
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);
  return !error && (count ?? 0) > 0;
}

/**
 * Server-side product fetch for /store/[id].
 * Returns null when the record is missing and the live catalog is in use.
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return getProductById(id) ?? null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    const local = getProductById(id);
    if (!local) return null;
    return (await liveCatalogAvailable(supabase)) ? null : local;
  }

  const row = { ...data };
  for (const key of BOOK_SPEC_KEYS) delete row[key];

  return {
    ...row,
    discount_percent: data.discount_percent || 0,
    is_published: data.is_published,
    image_url: data.image_url || undefined,
    ...readBookSpecs(data),
  };
}
