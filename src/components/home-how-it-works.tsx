import { QrCode, ScanLine, Layers } from "lucide-react";
import { HOME_HOW_IT_WORKS_COPY, HOME_UNLOCK_STEPS } from "@/lib/home";

const STEP_ICONS = [QrCode, ScanLine, Layers] as const;

export function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-24 border-t border-line bg-background py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8 lg:px-16">
        <div className="max-w-3xl">
          <p className="font-label mb-3 tracking-[0.12em] text-signal">
            {HOME_HOW_IT_WORKS_COPY.eyebrow}
          </p>
          <h2
            id="how-it-works-heading"
            className="font-heading text-h2 text-cream"
          >
            {HOME_HOW_IT_WORKS_COPY.heading}
          </h2>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-12 md:mt-16 md:grid-cols-3 md:gap-10">
          {HOME_UNLOCK_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <li key={step.number} className="flex flex-col gap-5">
                <div className="flex h-12 w-12 items-center justify-center border border-line text-cream">
                  <Icon size={22} strokeWidth={1.5} aria-hidden />
                </div>
                <div className="space-y-3">
                  <p className="font-label tracking-[0.12em] text-cream">
                    <span className="text-fg-muted">{step.number}</span>
                    <span className="mx-3 text-line" aria-hidden>
                      /
                    </span>
                    {step.label}
                  </p>
                  <p className="max-w-sm text-base leading-relaxed text-fg-secondary">
                    {step.copy}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
