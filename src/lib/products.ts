import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Product, DatabaseProduct } from "@/lib/types";

export const mapDatabaseProduct = (p: DatabaseProduct): Product => ({
  id: p.id,
  title: p.title,
  subtitle: p.subtitle || "",
  description: p.description || "",
  price: Number(p.price),
  discount_percent: Number(p.discount_percent || 0),
  difficulty: Number(p.difficulty || 1),
  age: p.age || "All Ages",
  category: p.category,
  color: p.color || "bg-gray-800",
  accent: p.accent || "bg-blue-500",
  image_url: p.image_url,
  is_published: p.is_published,
  created_at: p.created_at,
  updated_at: p.updated_at
});

export async function fetchPublishedProducts(limit?: number): Promise<{ data: Product[] | null; error: PostgrestError | null }> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  if (data) {
    return { data: data.map(mapDatabaseProduct), error: null };
  }

  return { data: [], error: null };
}

export async function fetchAllProducts(): Promise<{ data: Product[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  if (data) {
    return { data: data.map(mapDatabaseProduct), error: null };
  }

  return { data: [], error: null };
}

