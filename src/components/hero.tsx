"use client";

import { motion } from "framer-motion";
import { ArrowDown, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { useSettings } from "@/context/settings-context";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import { calculatePrice, formatPrice } from "@/lib/pricing";

const DEFAULT_HERO_COPY = {
  eyebrow: "Machine Brain Coloring Books",
  title: "Color",
  subtitle: "The Machine",
  description:
    "Premium sci-fi coloring books with thick paper, hidden unlocks, and collectible digital rewards.",
};

const HERO_STATS = ["100+ pages", "Hidden code", "Free shipping"];

export function Hero() {
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const { campaign } = useSettings();

  useEffect(() => {
    const fetchFeatured = async () => {
      // 1. Check if campaign has a specific featured product
      if (campaign.isActive && campaign.featuredProductId) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("id", campaign.featuredProductId)
          .single();

        if (data) {
          setFeaturedProduct(data);
          return;
        }
      }

      // 2. Fallback: Fetch the Holiday product (or fallback to newest)
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category", "HOLIDAY")
        .limit(1)
        .single();

      if (data) {
        setFeaturedProduct(data);
      } else {
        // Fallback to any product if holiday one is missing
        const { data: anyProduct } = await supabase
          .from("products")
          .select("*")
          .limit(1)
          .single();
        if (anyProduct) setFeaturedProduct(anyProduct);
      }
    };
    fetchFeatured();
  }, [campaign.isActive, campaign.featuredProductId]);

  const productLink = featuredProduct
    ? `/store/${featuredProduct.id}`
    : "/store";

  // Use centralized pricing utility
  const priceInfo = calculatePrice(
    {
      price: featuredProduct?.price || 15,
      discount_percent: featuredProduct?.discount_percent || 0,
    },
    campaign.isActive ? campaign : null,
  );

  // Determine theme or defaults
  const theme =
    campaign.isActive && campaign.theme
      ? campaign.theme
      : CAMPAIGN_TEMPLATES.default;
  const isDefault = theme.id === "default";
  const accentColor = campaign.isActive ? theme.colors.primary : "#FF4F00";
  const heroTitle = isDefault ? DEFAULT_HERO_COPY.title : theme.text.heroTitle;
  const heroSubtitle = isDefault
    ? DEFAULT_HERO_COPY.subtitle
    : theme.text.heroSubtitle;
  const heroDescription = isDefault
    ? DEFAULT_HERO_COPY.description
    : theme.text.heroDescription || DEFAULT_HERO_COPY.description;
  const heroEyebrow = campaign.isActive
    ? theme.text.heroTag
    : DEFAULT_HERO_COPY.eyebrow;

  // Texture Styles
  const getTextureStyle = () => {
    switch (theme.texture) {
      case "grid":
        return {
          backgroundImage:
            "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.1,
        };
      case "dots":
        return {
          backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          opacity: 0.2,
        };
      case "scanlines":
        return {
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)",
          opacity: 0.3,
        };
      case "noise":
        return { backgroundImage: "url('/textures/noise.svg')", opacity: 0.1 };
      case "none":
      default:
        return {
          backgroundImage:
            "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.1,
        };
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden border-b border-[#222] bg-[#0a0a0a]"
      style={{ "--hero-accent": accentColor } as CSSProperties}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={getTextureStyle()}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_78%_34%,rgba(255,79,0,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_45%)]" />

      <div className="relative grid min-h-[78vh] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col justify-center px-4 py-16 md:px-10 md:py-20 lg:px-16"
        >
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.32em] text-(--hero-accent)">
            {heroEyebrow}
          </p>

          <h1 className="mb-6 max-w-5xl font-heading text-6xl font-bold uppercase leading-[0.82] tracking-[-0.07em] text-white md:text-8xl lg:text-9xl">
            {heroTitle}
            <br />
            <span className="text-(--hero-accent)">{heroSubtitle}</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-gray-400 md:text-xl">
            {heroDescription}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-14 px-8 bg-(--hero-accent) text-white hover:bg-white hover:text-black font-heading text-lg uppercase tracking-widest rounded-none group"
            >
              <Link href="/store">
                Browse Books
                <ShoppingBag className="ml-2 h-5 w-5 transition-transform group-hover:scale-110" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 px-8 border-[#2a2a2a] bg-transparent text-gray-400 hover:border-white hover:bg-transparent hover:text-white font-heading text-lg uppercase tracking-widest rounded-none"
            >
              <Link href="/stories">Read Stories</Link>
            </Button>
          </div>
        </motion.div>

        <div className="relative flex items-center justify-center border-t border-[#222] bg-[#080808]/80 px-8 py-14 lg:border-l lg:border-t-0 lg:px-12">
          <div className="absolute inset-0 pointer-events-none bg-[url('/textures/noise.svg')] opacity-5 mix-blend-overlay" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[22px_22px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative w-full max-w-[300px] lg:max-w-[340px]"
          >
            <Link
              href={productLink}
              className="group block"
              aria-label={`View ${featuredProduct?.title || "featured book"}`}
            >
              <div className="relative aspect-3/4 bg-[#111] shadow-2xl transition-transform duration-500 ease-out group-hover:-translate-y-1">
                <div className="absolute -left-4 top-3 bottom-3 w-4 origin-right -skew-y-6 border-l border-y border-[#222] bg-[#050505]" />

                <div
                  className={`absolute inset-0 ${featuredProduct?.color || "bg-[#e63946]"} flex flex-col overflow-hidden border border-[#2a2a2a]`}
                >
                  <div className="absolute inset-0 z-20 pointer-events-none border-r border-white/10" />
                  {featuredProduct?.image_url ? (
                    <>
                      {/* next/image is avoided here because product URLs can be local Supabase or arbitrary uploads. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featuredProduct.image_url}
                        alt={`${featuredProduct.title} cover`}
                        className="absolute inset-0 h-full w-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-black/20" />
                    </>
                  ) : (
                    <>
                      <div className="relative z-10 flex h-16 items-center justify-center border-b border-black/10 bg-black/20 backdrop-blur-sm">
                        <span className="font-heading text-2xl uppercase tracking-tighter text-white/90">
                          {featuredProduct?.subtitle || "Cosmic Xmas"}
                        </span>
                      </div>
                      <div className="relative flex flex-1 items-center justify-center p-8">
                        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-30 mix-blend-multiply" />
                        <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full border-4 border-white/20">
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                            <Star className="h-12 w-12 text-white" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="relative z-20 mt-auto flex min-h-24 items-end justify-between gap-4 bg-black/85 p-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                        {featuredProduct?.category || "Featured Release"}
                      </p>
                      <p className="font-heading text-lg leading-none text-white">
                        {featuredProduct?.title || "Festive Sci-Fi"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      {priceInfo.hasDiscount ? (
                        <>
                          <span className="font-mono text-sm text-gray-500 line-through">
                            {formatPrice(priceInfo.originalPrice)}
                          </span>
                          <span className="font-heading text-2xl tracking-tight text-white">
                            {formatPrice(priceInfo.finalPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="font-heading text-2xl tracking-tight text-white">
                          {formatPrice(priceInfo.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 z-30 pointer-events-none bg-linear-to-tr from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>

            {!isDefault || campaign.isActive ? (
              <div className="absolute -right-4 -top-4 z-40 rotate-3 border border-white/20 bg-(--hero-accent) px-4 py-2 font-heading text-sm uppercase tracking-widest text-black shadow-lg">
                {theme.text.heroTag}
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      <div className="relative flex h-12 items-center justify-between border-t border-[#222] bg-[#0a0a0a] px-4 font-mono text-[10px] uppercase tracking-widest text-gray-600 md:px-10 lg:px-16">
        <div className="hidden gap-6 md:flex">
          {HERO_STATS.map((stat) => (
            <span key={stat}>{stat}</span>
          ))}
        </div>
        <button
          onClick={() =>
            document
              .getElementById("store-section")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="mx-auto flex cursor-pointer items-center gap-2 transition-colors hover:text-white md:mx-0"
          aria-label={`View ${theme.text.storyTag} collection`}
        >
          <span>View {theme.text.storyTag} Collection</span>
          <ArrowDown size={10} />
        </button>
      </div>
    </section>
  );
}
