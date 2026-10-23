import Image from "next/image";
import type { ReactNode } from "react";
import {
  COVER_FRAME,
  coverBandStyle,
  coverFrameSrc,
  coverWindowStyle,
  type CoverFrameVariant,
} from "@/lib/home";
import { cn } from "@/lib/utils";

type CoverFrameProps = {
  variant: CoverFrameVariant;
  /** Full-colour art, sized to fill the window (`fill` + `object-cover`). */
  art: ReactNode;
  /** Centred in the title band. */
  title: ReactNode;
  /** Centred in the band below the window. */
  footer?: ReactNode;
  className?: string;
};

/**
 * The book's front-cover frame on a plain near-black panel. Portrait only:
 * the box is locked to the SVG aspect so the frame is never stretched.
 * Art is clipped to the stepped window and the frame always sits on top.
 */
export function CoverFrame({
  variant,
  art,
  title,
  footer,
  className,
}: CoverFrameProps) {
  const src = coverFrameSrc(variant);
  const windowStyle = coverWindowStyle();

  return (
    <div
      data-testid="cover-frame"
      data-frame-src={src}
      className={cn("@container relative w-full bg-background", className)}
      style={{ aspectRatio: `${COVER_FRAME.width} / ${COVER_FRAME.height}` }}
    >
      <div
        data-testid="cover-frame-window"
        className="absolute overflow-hidden"
        style={windowStyle}
      >
        {art}
      </div>
      <Image
        src={src}
        alt=""
        aria-hidden
        width={COVER_FRAME.width}
        height={COVER_FRAME.height}
        unoptimized
        loading="eager"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
      />
      <div
        className="absolute flex items-center justify-center text-center"
        style={{
          ...coverBandStyle(COVER_FRAME.titleBand),
          left: windowStyle.left,
          right: windowStyle.left,
        }}
      >
        {title}
      </div>
      {footer ? (
        <div
          className="absolute inset-x-0 flex items-center justify-center"
          style={coverBandStyle(COVER_FRAME.footerBand)}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
