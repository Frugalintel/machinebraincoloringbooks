import Image from "next/image";
import type { ReactNode } from "react";
import {
  FRAME_PORTRAIT_HEIGHT,
  FRAME_PORTRAIT_SRC,
  FRAME_PORTRAIT_WIDTH,
  FRAME_WINDOW_INSET,
} from "@/lib/home";
import { cn } from "@/lib/utils";

type PortraitFrameProps = {
  children: ReactNode;
  className?: string;
  sizes?: string;
};

export function PortraitFrame({
  children,
  className,
  sizes = "(min-width: 1024px) 28rem, 86vw",
}: PortraitFrameProps) {
  return (
    <div
      data-testid="hero-portrait-frame"
      className={cn("relative w-full", className)}
      style={{
        aspectRatio: `${FRAME_PORTRAIT_WIDTH} / ${FRAME_PORTRAIT_HEIGHT}`,
      }}
    >
      <Image
        src={FRAME_PORTRAIT_SRC}
        alt=""
        fill
        sizes={sizes}
        className="pointer-events-none object-contain object-center"
        aria-hidden
      />
      <div
        data-testid="hero-art-window"
        className="absolute overflow-hidden border border-cream"
        style={{ inset: FRAME_WINDOW_INSET }}
      >
        {children}
      </div>
    </div>
  );
}
