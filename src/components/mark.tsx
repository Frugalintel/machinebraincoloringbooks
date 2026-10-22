import Link from "next/link";
import type { ReactNode } from "react";
import {
  MARK_CORNER_ARM_RATIO,
  resolveMarkAsset,
  type MarkInk,
} from "@/lib/mark";
import { cn } from "@/lib/utils";

export type MarkProps = {
  /** Rendered CSS-pixel size. Full mark-v6 is used only at ≥ 48. */
  size: number;
  ink?: MarkInk;
  /** When true (lockups with a visible wordmark), alt is empty. */
  decorative?: boolean;
  className?: string;
};

/**
 * Official Machine Brain mark. Renders nothing below 48 px until the
 * rebuilt small cut lands (callers keep today's wordmark in that case).
 */
export function Mark({
  size,
  ink = "cream",
  decorative = false,
  className,
}: MarkProps) {
  const asset = resolveMarkAsset(size, ink);
  if (!asset) {
    return null;
  }

  return (
    // Official Studio SVG: do not run through next/image (no redraw / recompress).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.src}
      alt={decorative ? "" : "Machine Brain"}
      width={size}
      height={size}
      className={cn("block shrink-0", className)}
      style={{ width: size, height: size }}
      decoding="async"
    />
  );
}

export type BrandLockupLayout = "horizontal" | "stacked";
export type BrandLockupHeading = "h1" | "span";

export type BrandLockupProps = {
  layout: BrandLockupLayout;
  markSize: number;
  ink?: MarkInk;
  href?: string;
  className?: string;
  wordmarkClassName?: string;
  subtitle?: ReactNode;
  headingLevel?: BrandLockupHeading;
};

function lockupDirection(layout: BrandLockupLayout): string {
  switch (layout) {
    case "horizontal":
      return "flex-row items-center";
    case "stacked":
      return "flex-col items-center text-center";
    default: {
      const _exhaustive: never = layout;
      throw new Error(`Unhandled lockup layout: ${String(_exhaustive)}`);
    }
  }
}

function WordmarkTag({
  headingLevel,
  className,
  children,
}: {
  headingLevel: BrandLockupHeading;
  className: string;
  children: ReactNode;
}) {
  switch (headingLevel) {
    case "h1":
      return <h1 className={className}>{children}</h1>;
    case "span":
      return <span className={className}>{children}</span>;
    default: {
      const _exhaustive: never = headingLevel;
      throw new Error(`Unhandled lockup heading: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Mark + Inter 700 "Machine Brain" lockup. Below 48 px the mark is omitted
 * so the existing wordmark-only treatment remains.
 */
export function BrandLockup({
  layout,
  markSize,
  ink = "cream",
  href = "/",
  className,
  wordmarkClassName,
  subtitle,
  headingLevel = "span",
}: BrandLockupProps) {
  const asset = resolveMarkAsset(markSize, ink);
  const inkClass = ink === "cream" ? "text-cream" : "text-ink";

  return (
    <Link
      href={href}
      aria-label="Machine Brain"
      className={cn("inline-flex min-w-0 no-underline", className)}
    >
      <span
        className={cn("inline-flex min-w-0", lockupDirection(layout))}
        style={
          asset
            ? {
                gap: `calc(${markSize}px * ${MARK_CORNER_ARM_RATIO})`,
              }
            : undefined
        }
      >
        <Mark size={markSize} ink={ink} decorative />
        <span
          className={cn(
            "flex min-w-0 flex-col leading-none",
            layout === "stacked" && "items-center",
          )}
        >
          <WordmarkTag
            headingLevel={headingLevel}
            className={cn(
              "whitespace-nowrap font-heading font-bold uppercase tracking-[0.02em]",
              inkClass,
              wordmarkClassName,
            )}
          >
            Machine Brain
          </WordmarkTag>
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
