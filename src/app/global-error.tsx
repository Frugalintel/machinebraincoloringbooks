"use client";

import { SystemState } from "@/components/system-state";
import { displayFont, monoFont, sansFont } from "@/lib/fonts";
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html
      lang="en"
      className={`dark ${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="antialiased overflow-x-hidden bg-background font-sans text-foreground">
        <SystemState kind="error" reset={reset} standalone />
      </body>
    </html>
  );
}
