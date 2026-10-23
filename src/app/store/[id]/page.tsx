import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { toSentenceCase } from "@/lib/display-text";
import { Product } from "@/lib/types";
import { ProductClient } from "./product-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Server-side product fetching
async function getProduct(id: string): Promise<Product | null> {
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
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | MACHINE BRAIN",
      description: "The requested product could not be found.",
    };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://machinebraincoloringbooks.com";

  return {
    title: `${toSentenceCase(product.title)} | Machine Brain coloring books`,
    description:
      product.description ||
      `${toSentenceCase(product.title)} - ${product.subtitle}. Vintage sci-fi coloring book.`,
    openGraph: {
      title: `${toSentenceCase(product.title)} | Machine Brain`,
      description:
        product.description ||
        `${toSentenceCase(product.title)} - Vintage sci-fi coloring book`,
      type: "website",
      url: `${baseUrl}/store/${product.id}`,
      images: product.image_url
        ? [
            {
              url: product.image_url,
              width: 800,
              height: 600,
              alt: toSentenceCase(product.title),
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${toSentenceCase(product.title)} | Machine Brain`,
      description:
        product.description ||
        `${toSentenceCase(product.title)} - Vintage sci-fi coloring book`,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductClient product={product} />;
}
