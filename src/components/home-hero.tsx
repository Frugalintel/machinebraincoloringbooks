import Image from "next/image";
import Link from "next/link";
import { CoverFrame } from "@/components/cover-frame";
import { HOME_CONTAINER } from "@/components/home-section";
import { HomeSpecPlate } from "@/components/home-spec-plate";
import { Button } from "@/components/ui/button";
import { HERO_ART, HOME_HERO_CALLOUTS, HOME_HERO_COPY } from "@/lib/home";
import { cn } from "@/lib/utils";

/** Window is 1420/1700 of the frame; the frame tops out at 741 px wide. */
const HERO_ART_SIZES = "(min-width: 1024px) 619px, calc(83.5vw - 27px)";

export function HomeHero() {
  return (
    <section aria-labelledby="home-hero-title" className="bg-background">
      <div className={cn(HOME_CONTAINER, "home-hero-grid")}>
        <div className="home-hero-frame">
          <CoverFrame
            variant="full"
            title={
              <h1
                id="home-hero-title"
                className="font-display cover-title text-cream"
              >
                {HOME_HERO_COPY.title}
              </h1>
            }
            art={
              <Image
                src={HERO_ART.src}
                alt={HERO_ART.alt}
                fill
                preload
                fetchPriority="high"
                sizes={HERO_ART_SIZES}
                className="object-cover object-center"
              />
            }
          />
        </div>

        <div data-testid="hero-copy" className="home-hero-copy">
          <p className="font-label text-[12px] text-cream">
            <span className="text-signal">{HOME_HERO_COPY.eyebrowAccent}</span>
            {HOME_HERO_COPY.eyebrowRest.map((part) => (
              <span key={part}>
                <span aria-hidden className="px-[0.6em]">
                  ·
                </span>
                {part}
              </span>
            ))}
          </p>
          <hr className="mt-4 border-0 border-t border-cream" />

          <p className="mt-5 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-cream text-balance lg:text-[32px]">
            {HOME_HERO_COPY.tagline}
          </p>
          <p className="mt-4 text-base leading-[1.65] text-fg-secondary lg:text-[17px]">
            {HOME_HERO_COPY.body}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href={HOME_HERO_COPY.primaryCta.href}>
                {HOME_HERO_COPY.primaryCta.label}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-cream text-base"
            >
              <Link href={HOME_HERO_COPY.secondaryCta.href}>
                {HOME_HERO_COPY.secondaryCta.label}
              </Link>
            </Button>
          </div>

          <dl className="mt-8 grid grid-cols-[6.5rem_1fr] gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em]">
            {HOME_HERO_CALLOUTS.map((callout) => (
              <div key={callout.label} className="contents">
                <dt className="font-medium text-cream">{callout.label}</dt>
                <dd className="text-fg-secondary">{callout.value}</dd>
              </div>
            ))}
          </dl>

          <HomeSpecPlate className="mt-12" />
        </div>
      </div>
    </section>
  );
}
