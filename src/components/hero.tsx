"use client";

import { useEffect, useState } from "react";
import { HeroCard } from "@/components/hero-card";
import { useSettings } from "@/context/settings-context";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import {
  resolveFeaturedFromCatalog,
  resolveHeroCardProps,
  type HeroCardProps,
} from "@/lib/hero-card";
import { supabase } from "@/lib/supabase";
import { type Product } from "@/lib/types";

export { HERO_FALLBACK_COVER } from "@/lib/hero-card";
export type { HeroCardProps } from "@/lib/hero-card";

export function Hero(overrides: Partial<HeroCardProps> = {}) {
  const { campaign } = useSettings();
  const isActive = campaign.isActive;
  const featuredProductId = campaign.featuredProductId;
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(() =>
    resolveFeaturedFromCatalog(campaign),
  );

  useEffect(() => {
    const catalogHint = { isActive, featuredProductId };

    const fetchFeatured = async () => {
      if (isActive && featuredProductId) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("id", featuredProductId)
          .single();

        if (data) {
          setFeaturedProduct(data);
          return;
        }
      }

      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category", "HOLIDAY")
        .limit(1)
        .single();

      if (data) {
        setFeaturedProduct(data);
        return;
      }

      const { data: anyProduct } = await supabase
        .from("products")
        .select("*")
        .limit(1)
        .single();

      if (anyProduct) {
        setFeaturedProduct(anyProduct);
        return;
      }

      setFeaturedProduct(resolveFeaturedFromCatalog(catalogHint));
    };

    void fetchFeatured();
  }, [featuredProductId, isActive]);

  const theme =
    campaign.isActive && campaign.theme
      ? campaign.theme
      : CAMPAIGN_TEMPLATES.default;

  const card = resolveHeroCardProps(
    { product: featuredProduct, campaign },
    overrides,
  );

  return <HeroCard {...card} texture={theme.texture} />;
}
