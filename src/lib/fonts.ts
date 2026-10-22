import localFont from "next/font/local";

/** Redaction 50 Bold — home hero and one H1 page title only. */
export const displayFont = localFont({
  src: "../fonts/redaction/Redaction50-Bold.woff2",
  weight: "700",
  style: "normal",
  display: "swap",
  variable: "--font-redaction-50",
  preload: true,
});

/** Inter variable (wght 400–700) — UI, body, headings below H1. */
export const sansFont = localFont({
  src: "../fonts/inter/Inter-Variable.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

/** IBM Plex Mono 400/500 — labels, badges, eyebrows (above the fold). */
export const monoFont = localFont({
  src: [
    {
      path: "../fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-mono/IBMPlexMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-plex-mono",
  preload: true,
});
