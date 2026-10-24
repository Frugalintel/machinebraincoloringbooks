import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { fetchProductById } from "@/lib/product-lookup";
import { SITE_URL } from "@/lib/site-url";
import { bookName, productDescription, storeShowsSamples } from "@/lib/store";
import { ProductClient } from "./product-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for SSG
export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: products } = await supabase
      .from("products")
      .select("id")
      .eq("is_published", true);

    if (!products) return [];

    return products.map((product) => ({
      id: product.id,
    }));
  } catch {
    return [];
  }
}

// Dynamic metadata generation for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    return {
      title: "Book not found | Machine Brain",
      description: "This book is not in the catalog.",
    };
  }

  const title = `${bookName(product)} | Machine Brain`;
  const description = productDescription(product);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/store/${product.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <ProductClient
      product={product}
      samples={storeShowsSamples(process.env.VERCEL_ENV)}
    />
  );
}
