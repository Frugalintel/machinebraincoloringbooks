import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types";

/**
 * Server-side product fetch for /store/[id].
 * Returns null when the database is unset or the record is missing.
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    discount_percent: data.discount_percent || 0,
    is_published: data.is_published,
    image_url: data.image_url || undefined,
  };
}
