import { buildQrSvgPath } from "@/lib/qr";
import { cn } from "@/lib/utils";

type HomeQrProps = {
  /** Absolute URL the code encodes. */
  value: string;
  className?: string;
};

/** Ink #141414 modules on a plain cream box. The quiet zone is part of the box. */
export function HomeQr({ value, className }: HomeQrProps) {
  const qr = buildQrSvgPath(value);

  return (
    <svg
      data-testid="home-qr"
      data-qr-value={value}
      viewBox={`0 0 ${qr.viewBoxSize} ${qr.viewBoxSize}`}
      shapeRendering="crispEdges"
      aria-hidden
      className={cn("block aspect-square bg-cream", className)}
    >
      <path d={qr.path} fill="#141414" />
    </svg>
  );
}
