import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import type { HeroCardProps } from "@/lib/hero-card";
import type { CampaignTheme } from "@/lib/types";

const GRID_TEXTURE: CSSProperties = {
  backgroundImage:
    "linear-gradient(#33322F 1px, transparent 1px), linear-gradient(90deg, #33322F 1px, transparent 1px)",
  backgroundSize: "40px 40px",
  opacity: 0.1,
};

export function getHeroTextureStyle(
  texture: CampaignTheme["texture"],
): CSSProperties {
  switch (texture) {
    case "grid":
      return GRID_TEXTURE;
    case "dots":
      return {
        backgroundImage: "radial-gradient(#6A675F 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        opacity: 0.2,
      };
    case "scanlines":
      return {
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--base) 3px)",
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

export type HeroCardViewProps = HeroCardProps & {
  texture?: CampaignTheme["texture"];
};

export function HeroCard({
  brandEyebrow,
  headlineWhite,
  headlineAccent,
  subcopy,
  primaryCta,
  secondaryCta,
  featureChips,
  coverImage,
  coverAlt = "Featured coloring book cover",
  coverHref = "/store",
  badgeLabel,
  price,
  originalPrice,
  accentColor,
  collectionLink,
  texture,
}: HeroCardViewProps) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate w-full overflow-hidden bg-background"
      style={{ "--hero-accent": accentColor } as CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={getHeroTextureStyle(texture)}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/textures/noise.svg')] opacity-[0.05] mix-blend-overlay"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-[42%] right-1/2 h-[42%] w-[80%] translate-x-1/2 rounded-full bg-(--hero-accent)/12 blur-3xl lg:top-1/2 lg:right-[12%] lg:h-[55%] lg:w-[38%] lg:translate-x-0"
        aria-hidden
      />

      <div
        data-testid="hero-layout"
        className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[88rem] flex-col items-center px-5 pb-16 pt-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-16 lg:pb-24 lg:pt-12"
      >
        <div
          data-testid="hero-copy"
          className="flex w-full max-w-xl flex-col items-center text-center lg:max-w-none lg:flex-1 lg:items-start lg:text-left"
        >
          <p className="font-label mb-3 text-primary tracking-[0.12em] text-(--hero-accent) sm:mb-5">
            {brandEyebrow}
          </p>
          <h1
            id="home-hero-heading"
            className="font-display text-hero uppercase text-cream"
          >
            <span className="block">{headlineWhite}</span>
            <span className="mt-1 block text-(--hero-accent)">
              {headlineAccent}
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-fg-muted sm:mt-6 sm:leading-7">
            {subcopy}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:gap-4 lg:items-start">
            <Button
              asChild
              className="h-11 rounded-md bg-(--hero-accent) px-8 font-heading font-semibold text-sm uppercase tracking-[0.06em] text-ink hover:bg-cream hover:text-ink sm:h-12"
            >
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            <Link
              href={secondaryCta.href}
              className="inline-flex min-h-10 items-center font-medium text-sm uppercase tracking-[0.04em] text-fg-muted transition-colors hover:text-cream sm:min-h-11"
            >
              {secondaryCta.label}
            </Link>
          </div>
          {featureChips.length > 0 ? (
            <ul className="mt-6 flex flex-wrap items-center justify-center sm:mt-8 lg:justify-start">
              {featureChips.map((chip, index) => (
                <li key={chip.label} className="flex items-center">
                  {index > 0 ? (
                    <span
                      className="mx-3 h-3 w-px bg-fg-faint sm:mx-5"
                      aria-hidden
                    />
                  ) : null}
                  <span className="font-label tracking-[0.08em] text-fg-muted">
                    {chip.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div
          data-testid="hero-cover-stage"
          className="hero-cover-stage relative mt-8 flex w-full items-center justify-center px-4 pb-6 lg:mt-0 lg:w-auto lg:flex-1 lg:px-8 lg:pb-0"
        >
          <div className="relative">
            <Link
              href={coverHref}
              className="hero-book-3d group block"
              aria-label={coverAlt}
            >
              <span className="hero-book-shadow" aria-hidden />
              <span className="hero-book-spine" aria-hidden />
              <span className="hero-book-pages" aria-hidden />
              <span className="hero-book-top" aria-hidden />
              <span className="hero-book-front">
                {/* next/image is avoided here because product URLs can be local Supabase or arbitrary uploads. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt={coverAlt}
                  className="h-full w-full object-cover"
                />
              </span>
            </Link>
            <span
              data-testid="hero-price-badge"
              className="pointer-events-none absolute right-0 bottom-4 z-30 rounded-xl bg-cream px-4 py-3 text-left text-ink shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:bottom-6 lg:-right-2 lg:bottom-10"
            >
              <span className="font-label block tracking-[0.08em] text-ink/60">
                {badgeLabel}
              </span>
              {originalPrice ? (
                <span className="price-inline mt-1 block text-base text-ink/60 line-through">
                  {originalPrice}
                </span>
              ) : null}
              <span className="price mt-1 block text-[1.5rem] leading-none">
                {price}
              </span>
            </span>
          </div>
        </div>
      </div>

      <Link
        href={collectionLink.href}
        className="absolute bottom-5 left-1/2 z-20 inline-flex min-h-11 -translate-x-1/2 items-center gap-2 font-medium text-sm uppercase tracking-[0.04em] text-fg-muted transition-colors hover:text-cream lg:left-16 lg:translate-x-0"
      >
        <span>{collectionLink.label}</span>
        <ArrowDown size={12} />
      </Link>
    </section>
  );
}
