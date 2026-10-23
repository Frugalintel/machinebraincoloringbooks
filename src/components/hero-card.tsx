import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/cover-art";
import { PortraitFrame } from "@/components/portrait-frame";
import { toSentenceCase } from "@/lib/display-text";
import type { HeroCardProps } from "@/lib/hero-card";

export type HeroCardViewProps = HeroCardProps;

const HERO_ART_SIZES = "(min-width: 1024px) 22rem, 70vw";

export function HeroCard({
  brandEyebrow,
  headlineWhite,
  headlineAccent,
  subcopy,
  primaryCta,
  secondaryCta,
  coverImage,
  coverAlt = "Featured coloring book art",
  coverHref = "/store",
  badgeLabel,
  price,
  originalPrice,
}: HeroCardViewProps) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate w-full bg-background"
    >
      <div
        data-testid="hero-layout"
        className="mx-auto flex w-full max-w-[88rem] flex-col gap-12 px-5 pb-16 pt-10 sm:px-8 lg:min-h-[calc(100svh-5rem)] lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-16 lg:pb-24 lg:pt-16"
      >
        <div
          data-testid="hero-copy"
          className="flex w-full max-w-xl flex-col items-start text-left lg:max-w-none lg:flex-1"
        >
          <p className="font-label mb-4 text-signal tracking-[0.12em]">
            {brandEyebrow}
          </p>
          <h1
            id="home-hero-heading"
            className="font-display text-hero text-cream"
          >
            <span className="block">{headlineWhite}</span>
            <span className="mt-1 block text-cream">{headlineAccent}</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-fg-secondary sm:text-lg sm:leading-7">
            {subcopy}
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="px-8">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </div>
        </div>

        <div
          data-testid="hero-cover-stage"
          className="flex w-full justify-center lg:w-auto lg:flex-none lg:justify-end"
        >
          <Link
            href={coverHref}
            aria-label={coverAlt}
            className="block w-[min(22rem,86vw)] lg:w-[min(28rem,36vw)]"
          >
            <PortraitFrame sizes="(min-width: 1024px) 28rem, 86vw">
              <CoverArt
                src={coverImage}
                alt={coverAlt}
                sizes={HERO_ART_SIZES}
                priority
              />
              <span
                data-testid="hero-price-badge"
                className="absolute right-3 bottom-3 z-10 bg-cream px-3 py-2 text-left text-ink"
              >
                <span className="font-label block tracking-[0.08em] text-ink/60">
                  {toSentenceCase(badgeLabel)}
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
            </PortraitFrame>
          </Link>
        </div>
      </div>
    </section>
  );
}
