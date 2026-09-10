"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/settings-context";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import { type CampaignTheme, type Product } from "@/lib/types";

export const HERO_FALLBACK_COVER = "/covers/hero-example.jpg";

const DEFAULT_HERO_COPY = {
  eyebrow: "Machine Brain Coloring Books",
  title: "Color",
  subtitle: "The Machine",
  description:
    "Sci-fi coloring books with hidden stories inside. Thick paper, unlock codes, and collectible digital rewards.",
};

const HERO_STATS = ["100+ pages", "Hidden code", "Free shipping"];

const GRID_TEXTURE: CSSProperties = {
  backgroundImage:
    "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
  backgroundSize: "40px 40px",
  opacity: 0.1,
};

function getTextureStyle(texture: CampaignTheme["texture"]): CSSProperties {
  switch (texture) {
    case "grid":
      return GRID_TEXTURE;
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
    case undefined:
      return GRID_TEXTURE;
    default: {
      const _exhaustive: never = texture;
      void _exhaustive;
      return GRID_TEXTURE;
    }
  }
}

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
  const coverSrc = featuredProduct?.image_url || HERO_FALLBACK_COVER;
  const featuredTitle = featuredProduct?.title || "Festive Sci-Fi";
  const featuredCategory = featuredProduct?.category || "Featured Release";

  const priceInfo = calculatePrice(
    {
      price: featuredProduct?.price || 15,
      discount_percent: featuredProduct?.discount_percent || 0,
    },
    campaign.isActive ? campaign : null,
  );

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

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative w-full min-h-[100svh] overflow-hidden bg-[#0a0a0a]"
      style={{ "--hero-accent": accentColor } as CSSProperties}
    >
      <div className="absolute inset-0 overflow-hidden bg-[#080808]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={getTextureStyle(theme.texture)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.12 }}
          className="hero-ken-burns hero-stage-perspective absolute inset-0 flex items-center justify-center pr-0 sm:justify-end sm:pr-[6%] lg:pr-[10%]"
        >
          <Link
            href={productLink}
            className="hero-book-3d group"
            aria-label={`View ${featuredTitle}`}
          >
            <span className="hero-book-shadow" aria-hidden />
            <span className="hero-book-spine" aria-hidden />
            <span className="hero-book-pages" aria-hidden />
            <span className="hero-book-top" aria-hidden />
            <span className="hero-book-front">
              {/* next/image is avoided here because product URLs can be local Supabase or arbitrary uploads. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverSrc}
                alt={`${featuredTitle} cover`}
                className="h-full w-full object-cover"
              />
              <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-black/5 to-black/15" />
            </span>
          </Link>
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-[url('/textures/noise.svg')] opacity-[0.06] mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#0a0a0a] via-[#0a0a0a]/88 to-transparent lg:w-[55%]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-[#080808]/35 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 72% 48%, color-mix(in srgb, var(--hero-accent) 10%, transparent), transparent 50%)",
          }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-20 right-5 z-10 sm:bottom-12 sm:right-10 lg:bottom-14 lg:right-16">
        <Link
          href={productLink}
          className="pointer-events-auto block border border-white/20 bg-black/85 px-4 py-3 backdrop-blur-sm transition-colors hover:border-(--hero-accent)/60"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            {featuredCategory}
          </p>
          <div className="mt-1 flex items-end justify-between gap-8">
            <p className="font-heading text-lg leading-none text-white">
              {featuredTitle}
            </p>
            <div className="flex flex-col items-end">
              {priceInfo.hasDiscount ? (
                <>
                  <span className="font-mono text-sm text-zinc-500 line-through">
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
        </Link>
      </div>

      {!isDefault || campaign.isActive ? (
        <div className="absolute right-6 top-6 z-30 rotate-3 border border-white/20 bg-(--hero-accent) px-3 py-1.5 font-heading text-xs uppercase tracking-widest text-black shadow-lg sm:right-10 sm:top-8 sm:px-4 sm:py-2 sm:text-sm">
          {theme.text.heroTag}
        </div>
      ) : null}

      <div className="relative z-20 flex min-h-[100svh] w-full items-center pb-28 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-hud-scan relative w-full max-w-[88rem] px-5 py-16 sm:px-8 md:px-12 lg:w-[38%] lg:max-w-none lg:px-16"
        >
          <div
            className="absolute top-0 hidden h-full w-px bg-linear-to-b from-transparent via-(--hero-accent)/50 to-transparent lg:block"
            style={{ left: "calc(100% - 1px)" }}
            aria-hidden
          />
          <div className="flex max-w-xl flex-col border border-[#222]/80 bg-[#0a0a0a]/55 p-6 backdrop-blur-[2px] sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-(--hero-accent) sm:text-xs">
              {heroEyebrow}
            </p>
            <h1
              id="home-hero-heading"
              className="font-heading text-[clamp(2.75rem,7vw+0.6rem,5.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em] text-white"
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
                className="h-12 min-h-12 w-full rounded-none bg-(--hero-accent) px-7 font-heading text-base uppercase tracking-[0.18em] text-white hover:bg-white hover:text-black sm:w-auto sm:px-8"
              >
                <Link href="/store">Browse Books</Link>
              </Button>
              <Link
                href="/stories"
                className="inline-flex min-h-12 items-center justify-center px-1 font-heading text-sm uppercase tracking-[0.22em] text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline"
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
      </div>

      <div className="absolute bottom-4 left-5 z-20 sm:left-8 md:left-12 lg:left-16">
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
