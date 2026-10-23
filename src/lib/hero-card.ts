import { resolveCampaignTheme } from "@/lib/campaign-templates";
import { HERO_FALLBACK_COVER, HOME_HERO_COPY } from "@/lib/home";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { getProductById, getProductsByCategory } from "@/lib/store-data";
import type { CampaignSettings, CampaignTheme, Product } from "@/lib/types";

export { HERO_FALLBACK_COVER } from "@/lib/home";

export type HeroCta = {
  label: string;
  href: string;
};

export type HeroCardProps = {
  brandEyebrow: string;
  headlineWhite: string;
  headlineAccent: string;
  subcopy: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  coverImage: string;
  coverAlt?: string;
  coverHref?: string;
  badgeLabel: string;
  price: string;
  originalPrice?: string;
};

export type HeroCardSource = {
  product?: Product | null;
  campaign?: CampaignSettings | null;
};

export const DEFAULT_HERO_CARD: HeroCardProps = {
  brandEyebrow: HOME_HERO_COPY.brandEyebrow,
  headlineWhite: HOME_HERO_COPY.headlineWhite,
  headlineAccent: HOME_HERO_COPY.headlineAccent,
  subcopy: HOME_HERO_COPY.subcopy,
  primaryCta: { ...HOME_HERO_COPY.primaryCta },
  secondaryCta: { ...HOME_HERO_COPY.secondaryCta },
  coverImage: HERO_FALLBACK_COVER,
  coverAlt: "Featured coloring book art",
  coverHref: "/store",
  badgeLabel: "HOLIDAY",
  price: "$15.00",
};

export function resolveFeaturedFromCatalog(
  campaign?: Pick<CampaignSettings, "isActive" | "featuredProductId"> | null,
): Product | null {
  if (campaign?.isActive && campaign.featuredProductId) {
    const featured = getProductById(campaign.featuredProductId);
    if (featured) return featured;
  }

  return getProductsByCategory("HOLIDAY")[0] ?? null;
}

export function resolveHeroCardProps(
  source: HeroCardSource = {},
  overrides: Partial<HeroCardProps> = {},
): HeroCardProps {
  const product = source.product ?? null;
  const campaign = source.campaign ?? null;
  const theme = resolveTheme(campaign);
  const useCampaignCopy = shouldUseCampaignCopy(campaign, theme);

  const priceInfo = calculatePrice(
    {
      price: product?.price ?? 15,
      discount_percent: product?.discount_percent ?? 0,
    },
    campaign?.isActive ? campaign : null,
  );

  const resolved: HeroCardProps = {
    brandEyebrow: campaign?.isActive
      ? theme.text.heroTag
      : DEFAULT_HERO_CARD.brandEyebrow,
    headlineWhite: useCampaignCopy
      ? theme.text.heroTitle
      : DEFAULT_HERO_CARD.headlineWhite,
    headlineAccent: useCampaignCopy
      ? theme.text.heroSubtitle
      : DEFAULT_HERO_CARD.headlineAccent,
    subcopy: useCampaignCopy
      ? (theme.text.heroDescription ?? DEFAULT_HERO_CARD.subcopy)
      : DEFAULT_HERO_CARD.subcopy,
    primaryCta: DEFAULT_HERO_CARD.primaryCta,
    secondaryCta: DEFAULT_HERO_CARD.secondaryCta,
    coverImage: product?.image_url || HERO_FALLBACK_COVER,
    coverAlt: `${product?.title || "Featured coloring book"} art`,
    coverHref: product ? `/store/${product.id}` : DEFAULT_HERO_CARD.coverHref,
    badgeLabel: resolveBadgeLabel(product, campaign, theme),
    price: formatPrice(
      priceInfo.hasDiscount ? priceInfo.finalPrice : priceInfo.originalPrice,
    ),
  };

  if (priceInfo.hasDiscount) {
    resolved.originalPrice = formatPrice(priceInfo.originalPrice);
  }

  return { ...resolved, ...overrides };
}

function resolveTheme(campaign?: CampaignSettings | null): CampaignTheme {
  if (campaign?.isActive && campaign.theme) {
    return resolveCampaignTheme(campaign.theme);
  }
  return resolveCampaignTheme();
}

function shouldUseCampaignCopy(
  campaign: CampaignSettings | null,
  theme: CampaignTheme,
): boolean {
  return Boolean(campaign?.isActive && theme.id !== "brand");
}

function resolveBadgeLabel(
  product: Product | null,
  campaign: CampaignSettings | null,
  theme: CampaignTheme,
): string {
  const catalogLabel = product?.category?.trim();
  if (catalogLabel) {
    return catalogLabel;
  }

  if (campaign?.isActive && theme.text.heroTag) {
    return theme.text.heroTag;
  }

  return DEFAULT_HERO_CARD.badgeLabel;
}
