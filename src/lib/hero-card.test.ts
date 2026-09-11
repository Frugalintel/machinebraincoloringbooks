import { describe, expect, it } from "vitest";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import {
  DEFAULT_HERO_ACCENT,
  DEFAULT_HERO_CARD,
  HERO_FALLBACK_COVER,
  resolveFeaturedFromCatalog,
  resolveHeroCardProps,
  type HeroCardProps,
} from "@/lib/hero-card";
import { products } from "@/lib/store-data";
import type { CampaignSettings, Product } from "@/lib/types";

const contractKeys: (keyof HeroCardProps)[] = [
  "brandEyebrow",
  "headlineWhite",
  "headlineAccent",
  "subcopy",
  "primaryCta",
  "secondaryCta",
  "featureChips",
  "coverImage",
  "badgeLabel",
  "price",
  "accentColor",
  "collectionLink",
];

const neonCircuit: Product = {
  id: "book-42",
  title: "Neon Circuit",
  subtitle: "Vol. 1",
  description: "A test book",
  price: 24,
  discount_percent: 0,
  category: "SCI-FI",
  difficulty: 2,
  age: "all",
  color: "bg-[#e63946]",
  accent: "#FF4F00",
  image_url: "https://cdn.example.com/neon-circuit.jpg",
  is_published: true,
};

function campaign(partial: Partial<CampaignSettings> = {}): CampaignSettings {
  return {
    isActive: false,
    name: "Default Campaign",
    discount: {
      enabled: false,
      type: "percentage",
      value: 0,
      scope: "global",
    },
    banner: {
      enabled: false,
      text: "",
      link: "",
      backgroundColor: "",
      textColor: "",
    },
    ...partial,
  };
}

describe("HeroCard prop contract", () => {
  it("exposes a typed default for every CMS field", () => {
    for (const key of contractKeys) {
      expect(DEFAULT_HERO_CARD[key]).toBeDefined();
    }

    expect(DEFAULT_HERO_CARD.brandEyebrow).toBe("Machine Brain Coloring Books");
    expect(DEFAULT_HERO_CARD.headlineWhite).toBe("Color");
    expect(DEFAULT_HERO_CARD.headlineAccent).toBe("The Machine");
    expect(DEFAULT_HERO_CARD.subcopy).toMatch(/hidden stories/i);
    expect(DEFAULT_HERO_CARD.primaryCta).toEqual({
      label: "Browse Books",
      href: "/store",
    });
    expect(DEFAULT_HERO_CARD.secondaryCta).toEqual({
      label: "Read Stories",
      href: "/stories",
    });
    expect(DEFAULT_HERO_CARD.featureChips.map((chip) => chip.label)).toEqual([
      "100+ pages",
      "Hidden code",
      "Free shipping",
    ]);
    expect(DEFAULT_HERO_CARD.coverImage).toBe(HERO_FALLBACK_COVER);
    expect(DEFAULT_HERO_CARD.badgeLabel).toBe("HOLIDAY");
    expect(DEFAULT_HERO_CARD.price).toBe("$15.00");
    expect(DEFAULT_HERO_CARD.accentColor).toBe(DEFAULT_HERO_ACCENT);
    expect(DEFAULT_HERO_CARD.collectionLink).toEqual({
      label: "View Sci-Fi Collection",
      href: "#store-section",
    });
  });

  it("resolves the local catalog holiday book when no live product is passed", () => {
    const featured = resolveFeaturedFromCatalog();
    const resolved = resolveHeroCardProps({ product: featured });

    expect(featured?.category).toBe("HOLIDAY");
    expect(featured?.price).toBe(15);
    expect(resolved.badgeLabel).toBe("HOLIDAY");
    expect(resolved.price).toBe("$15.00");
    expect(resolved.coverImage).toBe(HERO_FALLBACK_COVER);
    expect(resolved.accentColor).toBe(DEFAULT_HERO_ACCENT);
  });

  it("prefers product.image_url, catalog category, and calculated price", () => {
    const resolved = resolveHeroCardProps({ product: neonCircuit });

    expect(resolved.coverImage).toBe(neonCircuit.image_url);
    expect(resolved.coverHref).toBe("/store/book-42");
    expect(resolved.coverAlt).toMatch(/neon circuit/i);
    expect(resolved.badgeLabel).toBe("SCI-FI");
    expect(resolved.price).toBe("$24.00");
    expect(resolved.originalPrice).toBeUndefined();
  });

  it("falls back to the local JPEG when image_url is missing", () => {
    const { image_url: _unused, ...withoutCover } = neonCircuit;
    void _unused;

    const resolved = resolveHeroCardProps({ product: withoutCover });

    expect(resolved.coverImage).toBe(HERO_FALLBACK_COVER);
  });

  it("uses a single badge label and never repeats it", () => {
    const resolved = resolveHeroCardProps({
      product: { ...neonCircuit, category: "HOLIDAY" },
      campaign: campaign({
        isActive: true,
        theme: {
          ...CAMPAIGN_TEMPLATES.christmas,
          text: {
            ...CAMPAIGN_TEMPLATES.christmas.text,
            heroTag: "HOLIDAY",
          },
        },
      }),
    });

    expect(resolved.badgeLabel).toBe("HOLIDAY");
    expect(resolved.badgeLabel).not.toMatch(/HOLIDAY.+HOLIDAY/);
  });

  it("applies campaign headline, accent, and collection label without changing the card shape", () => {
    const resolved = resolveHeroCardProps({
      product: neonCircuit,
      campaign: campaign({
        isActive: true,
        theme: CAMPAIGN_TEMPLATES.cyberpunk,
      }),
    });

    expect(Object.keys(resolved).sort()).toEqual(
      Object.keys(resolveHeroCardProps({ product: neonCircuit })).sort(),
    );
    expect(resolved.headlineWhite).toBe(
      CAMPAIGN_TEMPLATES.cyberpunk.text.heroTitle,
    );
    expect(resolved.headlineAccent).toBe(
      CAMPAIGN_TEMPLATES.cyberpunk.text.heroSubtitle,
    );
    expect(resolved.accentColor).toBe(
      CAMPAIGN_TEMPLATES.cyberpunk.colors.primary,
    );
    expect(resolved.collectionLink.label).toBe("View Hacked Collection");
    expect(resolved.badgeLabel).toBe("SCI-FI");
  });

  it("formats discounted prices with calculatePrice / formatPrice", () => {
    const resolved = resolveHeroCardProps({
      product: { ...neonCircuit, discount_percent: 50 },
    });

    expect(resolved.originalPrice).toBe("$24.00");
    expect(resolved.price).toBe("$12.00");
  });

  it("lets explicit CMS overrides swap cover, chips, and headline", () => {
    const resolved = resolveHeroCardProps(
      { product: neonCircuit },
      {
        headlineWhite: "Paint",
        headlineAccent: "The Archive",
        coverImage: "https://cdn.example.com/archive.jpg",
        featureChips: [{ label: "200+ pages" }],
        price: "$9.00",
      },
    );

    expect(resolved.headlineWhite).toBe("Paint");
    expect(resolved.headlineAccent).toBe("The Archive");
    expect(resolved.coverImage).toBe("https://cdn.example.com/archive.jpg");
    expect(resolved.featureChips).toEqual([{ label: "200+ pages" }]);
    expect(resolved.price).toBe("$9.00");
    expect(resolved.badgeLabel).toBe("SCI-FI");
  });

  it("honors a campaign featuredProductId from the local catalog", () => {
    const mecha = products.find((product) => product.title === "MECHA");
    expect(mecha).toBeDefined();

    const featured = resolveFeaturedFromCatalog(
      campaign({ isActive: true, featuredProductId: mecha?.id }),
    );

    expect(featured?.id).toBe(mecha?.id);
  });
});
