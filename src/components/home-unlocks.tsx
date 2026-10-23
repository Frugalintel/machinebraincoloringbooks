import Link from "next/link";
import { HomeQr } from "@/components/home-qr";
import { HOME_CONTAINER, SectionRule } from "@/components/home-section";
import { HOME_UNLOCK_STEPS, HOME_UNLOCKS_COPY } from "@/lib/home";
import { siteUrl } from "@/lib/site-url";

export function HomeUnlocks() {
  return (
    <section
      id="unlocks"
      aria-labelledby="home-unlocks-heading"
      className="scroll-mt-24 bg-background pb-20 md:pb-28"
    >
      <div className={HOME_CONTAINER}>
        <SectionRule>{HOME_UNLOCKS_COPY.label}</SectionRule>

        <div className="home-unlocks-grid mt-10 md:mt-12">
          <div className="home-unlocks-steps">
            <h2
              id="home-unlocks-heading"
              className="text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-cream text-balance md:text-[28px]"
            >
              {HOME_UNLOCKS_COPY.heading}
            </h2>
            <ol className="mt-6 grid gap-3 md:grid-cols-3 md:gap-4">
              {HOME_UNLOCK_STEPS.map((step) => (
                <li
                  key={step.number}
                  className="flex min-h-[5.5rem] flex-col gap-2 border border-cream px-4 py-3.5"
                >
                  <span className="font-mono text-[12px] tracking-[0.1em] text-fg-secondary">
                    {step.number}
                  </span>
                  <span className="text-base leading-snug text-cream">
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="home-unlocks-qr flex items-start gap-5 md:flex-col md:gap-3">
            <Link
              href={HOME_UNLOCKS_COPY.qrPath}
              aria-label="Open the scanner"
              className="block shrink-0 focus-ring"
            >
              <HomeQr
                value={siteUrl(HOME_UNLOCKS_COPY.qrPath)}
                className="w-[164px]"
              />
            </Link>
            <p className="font-label max-w-[12rem] pt-1 text-cream md:pt-0">
              {HOME_UNLOCKS_COPY.qrCaption}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
