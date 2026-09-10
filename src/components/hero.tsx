"use client";

import { motion } from "framer-motion";
import { ArrowDown, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/settings-context";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";

const DEFAULT_HERO_COPY = {
  eyebrow: "Machine Brain Coloring Books",
  title: "Color",
  subtitle: "The Machine",
  description:
    "Sci-fi coloring books with hidden stories inside. Thick paper, unlock codes, and collectible digital rewards.",
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
      aria-labelledby="home-hero-heading"
      className="relative w-full overflow-hidden border-b border-[#222] bg-[#0a0a0a]"
      style={{ "--hero-accent": accentColor } as CSSProperties}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={getTextureStyle()}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 78% 34%, color-mix(in srgb, var(--hero-accent) 20%, transparent), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 45%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[88rem] grid-cols-1 lg:min-h-[min(40rem,calc(100svh-5rem))] lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,400px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col justify-center px-5 py-14 sm:px-8 md:px-12 md:py-16 lg:px-16 lg:py-20"
        >
          <div className="flex max-w-xl flex-col lg:max-w-2xl">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-(--hero-accent) sm:text-xs">
              {heroEyebrow}
            </p>

            <h1
              id="home-hero-heading"
              className="font-heading text-[clamp(2.75rem,8vw+0.6rem,5.75rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em] text-white"
            >
              <span className="block">{heroTitle}</span>
              <span className="mt-1 block text-(--hero-accent)">
                {heroSubtitle}
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-300 sm:text-lg sm:leading-7">
              {heroDescription}
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Button
                asChild
                className="h-12 min-h-12 w-full px-7 bg-(--hero-accent) text-white hover:bg-white hover:text-black font-heading text-base uppercase tracking-[0.18em] rounded-none group sm:w-auto sm:px-8"
              >
                <Link href="/store">
                  Browse Books
                  <ShoppingBag className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
                </Link>
              </Button>
              <Link
                href="/stories"
                className="inline-flex min-h-12 items-center justify-center px-1 font-heading text-sm uppercase tracking-[0.22em] text-zinc-500 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Read Stories
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#222] pt-6">
              {HERO_STATS.map((stat) => (
                <li
                  key={stat}
                  className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500"
                >
                  {stat}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <div className="relative flex items-center justify-center overflow-hidden border-t border-[#222] bg-[#080808]/80 px-5 py-10 sm:px-8 md:py-12 lg:border-l lg:border-t-0 lg:px-10 lg:py-16">
          <div className="absolute inset-0 pointer-events-none bg-[url('/textures/noise.svg')] opacity-5 mix-blend-overlay" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[22px_22px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative w-full max-w-[240px] pt-3 sm:max-w-[280px] lg:max-w-[300px]"
          >
            <Link
              href={productLink}
              className="group block"
              aria-label={`View ${featuredProduct?.title || "featured book"}`}
            >
              <div className="relative aspect-3/4 bg-[#111] shadow-2xl transition-transform duration-500 ease-out group-hover:-translate-y-1">
                <div className="absolute -left-3 top-3 bottom-3 w-3 origin-right -skew-y-6 border-l border-y border-[#222] bg-[#050505] sm:-left-4 sm:w-4" />

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
              <div className="absolute right-0 top-0 z-40 rotate-3 border border-white/20 bg-(--hero-accent) px-3 py-1.5 font-heading text-xs uppercase tracking-widest text-black shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                {theme.text.heroTag}
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      <div className="relative flex min-h-14 items-center justify-center border-t border-[#222] bg-[#0a0a0a] px-5 md:justify-end md:px-12 lg:px-16">
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("store-section")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-white"
          aria-label={`View ${theme.text.storyTag} collection`}
        >
          <span>View {theme.text.storyTag} Collection</span>
          <ArrowDown size={12} />
        </button>
      </div>
    </section>
  );
}
