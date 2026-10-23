import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 1200 px content grid: 16 px gutters on mobile, 120 px at 1440. */
export const HOME_CONTAINER =
  "mx-auto w-full max-w-[75rem] px-4 md:px-8 xl:px-0";

type SectionRuleProps = {
  id?: string;
  as?: "h2" | "p";
  children: ReactNode;
  className?: string;
};

/** A 1 px cream rule with a Plex label centred in it. */
export function SectionRule({
  id,
  as: Tag = "p",
  children,
  className,
}: SectionRuleProps) {
  return (
    <div className={cn("flex items-center gap-4 md:gap-6", className)}>
      <span aria-hidden className="h-px flex-1 bg-cream" />
      <Tag id={id} className="font-label shrink-0 text-center text-cream">
        {children}
      </Tag>
      <span aria-hidden className="h-px flex-1 bg-cream" />
    </div>
  );
}
