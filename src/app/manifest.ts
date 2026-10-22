import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Machine Brain",
    short_name: "Machine Brain",
    description: "Sci-fi coloring books with hidden stories inside.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0F0F",
    theme_color: "#0F0F0F",
    icons: [
      {
        src: "/brand/mb-mark-full-48px-cream.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/brand/mb-mark-full-64px-cream.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/brand/mb-mark-full-128px-cream.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/brand/mb-mark-full-256px-cream.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
