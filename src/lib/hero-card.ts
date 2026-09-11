import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { getProductById, getProductsByCategory } from "@/lib/store-data";
import type { CampaignSettings, CampaignTheme, Product } from "@/lib/types";

export const HERO_FALLBACK_COVER = "/covers/hero-example.jpg";
export const DEFAULT_HERO_ACCENT = "#FF4F00";

export type HeroCta = {
  label: string;
  href: string;
};

export type HeroFeatureChip = {
  label: string;
};

export type HeroCollectionLink = {
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
  featureChips: HeroFeatureChip[];
  coverImage: string;
  coverAlt?: string;
  coverHref?: string;
  badgeLabel: string;
  price: string;
  originalPrice?: string;
  accentColor: string;
  collectionLink: HeroCollectionLink;
};

export type HeroCardSource = {
  product?: Product | null;
  campaign?: CampaignSettings | null;
};

export const DEFAULT_HERO_CARD: HeroCardProps = {
  brandEyebrow: "Machine Brain Coloring Books",
  headlineWhite: "Color",
  headlineAccent: "The Machine",
  subcopy:
    "Sci-fi coloring books with hidden stories inside. Thick paper, unlock codes, and collectible digital rewards.",
  primaryCta: { label: "Browse Books", href: "/store" },
  secondaryCta: { label: "Read Stories", href: "/stories" },
  featureChips: [
    { label: "100+ pages" },
    { label: "Hidden code" },
    { label: "Free shipping" },
  ],
  coverImage: HERO_FALLBACK_COVER,
  coverAlt: "Featured coloring book cover",
  coverHref: "/store",
  badgeLabel: "HOLIDAY",
  price: "$15.00",
  accentColor: DEFAULT_HERO_ACCENT,
  collectionLink: {
    label: "View Sci-Fi Collection",
    href: "#store-section",
  },
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
    featureChips: DEFAULT_HERO_CARD.featureChips,
    coverImage: product?.image_url || HERO_FALLBACK_COVER,
    coverAlt: `${product?.title || "Featured coloring book"} cover`,
    coverHref: product ? `/store/${product.id}` : DEFAULT_HERO_CARD.coverHref,
    badgeLabel: resolveBadgeLabel(product, campaign, theme),
    price: formatPrice(
      priceInfo.hasDiscount ? priceInfo.finalPrice : priceInfo.originalPrice,
    ),
    accentColor: campaign?.isActive
      ? theme.colors.primary
      : DEFAULT_HERO_ACCENT,
    collectionLink: {
      label: `View ${useCampaignCopy ? theme.text.storyTag : "Sci-Fi"} Collection`,
      href: "#store-section",
    },
  };

  if (priceInfo.hasDiscount) {
    resolved.originalPrice = formatPrice(priceInfo.originalPrice);
  }

  return { ...resolved, ...overrides };
}

function resolveTheme(campaign?: CampaignSettings | null): CampaignTheme {
  if (campaign?.isActive && campaign.theme) {
    return campaign.theme;
  }
  return CAMPAIGN_TEMPLATES.default;
}

function shouldUseCampaignCopy(
  campaign: CampaignSettings | null,
  theme: CampaignTheme,
): boolean {
  return Boolean(campaign?.isActive && theme.id !== "default");
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
