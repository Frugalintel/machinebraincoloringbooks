import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HOME_CLOSE_COPY } from "@/lib/home";

export function HomeClose() {
  return (
    <section aria-labelledby="home-close-heading" className="bg-cream text-ink">
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-8 px-5 py-20 sm:px-8 md:py-28 lg:px-16">
        <p className="font-label tracking-[0.12em] text-ink">
          {HOME_CLOSE_COPY.eyebrow}
        </p>
        <div className="max-w-2xl space-y-5">
          <h2 id="home-close-heading" className="font-heading text-h2 text-ink">
            {HOME_CLOSE_COPY.heading}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-ink/70">
            {HOME_CLOSE_COPY.body}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" tone="cream" className="px-8">
            <Link href={HOME_CLOSE_COPY.primary.href}>
              {HOME_CLOSE_COPY.primary.label}
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" tone="cream">
            <Link href={HOME_CLOSE_COPY.secondary.href}>
              {HOME_CLOSE_COPY.secondary.label}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
