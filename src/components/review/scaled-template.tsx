"use client";

import { useEffect, useRef, useState } from "react";

export function ScaledTemplate({
  srcdoc,
  width,
  height,
  title,
}: {
  srcdoc: string;
  width: number;
  height: number;
  title: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    const frame = frameRef.current;
    const parent = frame?.parentElement;
    if (!parent) {
      return;
    }
    const update = () => {
      setScale(parent.clientWidth / width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-md border border-line bg-background"
      style={{ height: Math.max(120, height * scale) }}
    >
      <iframe
        ref={frameRef}
        title={title}
        srcDoc={srcdoc}
        sandbox="allow-scripts"
        className="absolute left-0 top-0 origin-top-left border-0"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}

export function CoverWrapPreview({
  srcdoc,
  width,
  height,
  foldsX,
  title,
}: {
  srcdoc: string;
  width: number;
  height: number;
  foldsX: number[];
  title: string;
}) {
  const [leftFold, rightFold] = foldsX;
  const backWidth = leftFold ?? width / 2;
  const spineWidth = Math.max(1, (rightFold ?? backWidth) - backWidth);
  const frontWidth = width - (rightFold ?? backWidth);
  return (
    <div className="space-y-3">
      <ScaledTemplate
        srcdoc={srcdoc}
        width={width}
        height={height}
        title={title}
      />
      <div
        className="grid gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
        style={{
          gridTemplateColumns: `${backWidth}fr ${spineWidth}fr ${frontWidth}fr`,
        }}
      >
        <span className="rounded bg-surface-1 px-2 py-1 text-center">Back</span>
        <span className="rounded bg-surface-1 px-2 py-1 text-center">
          Spine
        </span>
        <span className="rounded bg-surface-1 px-2 py-1 text-center">
          Front
        </span>
      </div>
    </div>
  );
}
