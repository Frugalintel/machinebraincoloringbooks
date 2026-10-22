import localFont from "next/font/local";

/** Redaction 50 Bold — titles and display only. */
export const displayFont = localFont({
  src: "../fonts/redaction/Redaction50-Bold.woff2",
  weight: "700",
  style: "normal",
  display: "swap",
  variable: "--font-redaction",
  preload: true,
});

/** Inter variable (wght 400–700) — UI and body. */
export const sansFont = localFont({
  src: "../fonts/inter/Inter-Variable.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

/** IBM Plex Mono 400/500 — technical labels. */
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
  variable: "--font-ibm-plex-mono",
  preload: false,
});
