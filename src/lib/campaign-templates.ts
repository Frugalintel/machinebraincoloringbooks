import { CampaignTheme } from "./types";

export const CAMPAIGN_TEMPLATES: Record<string, CampaignTheme> = {
  default: {
    id: "default",
    colors: {
      primary: "#2563eb", // Standard Blue
      secondary: "#1e293b",
      accent: "#f59e0b",
      background: "#0a0a0a",
      text: "#ffffff"
    },
    text: {
      heroTitle: "New Arrivals",
      heroSubtitle: "Explore the Collection",
      heroTag: "Featured",
      storyTag: "Sci-Fi"
    },
    texture: "dots",
    animation: "none",
    fontMode: "default"
  },
  cyberpunk: {
    id: "cyberpunk",
    colors: {
      primary: "#0ff", // Cyan
      secondary: "#f0f", // Magenta
      accent: "#ff0", // Yellow
      background: "#050505", // Black
      text: "#0ff"
    },
    text: {
      heroTitle: "NEON CITY",
      heroSubtitle: "System Override",
      heroTag: "Cyber Week",
      storyTag: "Hacked"
    },
    texture: "grid",
    animation: "glitch",
    fontMode: "mono"
  },
  retro_wave: {
    id: "retro_wave",
    colors: {
      primary: "#ff0099", // Hot Pink
      secondary: "#4900ff", // Deep Purple
      accent: "#00fff0", // Aqua
      background: "#120024", // Dark Purple
      text: "#ffffff"
    },
    text: {
      heroTitle: "RETRO WAVE",
      heroSubtitle: "Sunset Drive",
      heroTag: "Radical Sale",
      storyTag: "Vintage"
    },
    texture: "scanlines",
    animation: "pulse",
    fontMode: "default"
  },
  minimal: {
    id: "minimal",
    colors: {
      primary: "#ffffff", // White
      secondary: "#000000", // Black
      accent: "#333333", // Dark Gray
      background: "#ffffff", // White BG
      text: "#000000" // Black Text
    },
    text: {
      heroTitle: "Essentials",
      heroSubtitle: "Less is More",
      heroTag: "Collection",
      storyTag: "Pure"
    },
    texture: "none",
    animation: "none",
    fontMode: "serif"
  },
  christmas: {
    id: "christmas",
    colors: {
      primary: "#dc2626", // Red
      secondary: "#166534", // Green
      accent: "#fbbf24", // Gold
      background: "#0f172a", // Dark Blueish
      text: "#ffffff"
    },
    text: {
      heroTitle: "Holiday Event",
      heroSubtitle: "Season of Art",
      heroTag: "Holiday Special",
      storyTag: "Holiday"
    },
    texture: "dots",
    animation: "pulse",
    fontMode: "serif"
  },
  new_years: {
    id: "new_years",
    colors: {
      primary: "#fbbf24", // Gold
      secondary: "#000000",
      accent: "#e5e7eb", // Silver
      background: "#000000",
      text: "#fbbf24"
    },
    text: {
      heroTitle: "New Year",
      heroSubtitle: "New Beginnings",
      heroTag: "Limited Edition",
      storyTag: "Special"
    },
    texture: "noise",
    animation: "none",
    fontMode: "default"
  },
  valentines: {
    id: "valentines",
    colors: {
      primary: "#ec4899", // Pink
      secondary: "#be123c", // Red
      accent: "#fce7f3", // Light Pink
      background: "#3e0818", // Dark Pink/Red
      text: "#ffffff"
    },
    text: {
      heroTitle: "Valentine's",
      heroSubtitle: "Share the Love",
      heroTag: "Sweet Deal",
      storyTag: "Romance"
    },
    texture: "dots",
    animation: "pulse",
    fontMode: "serif"
  },
  july_4th: {
    id: "july_4th",
    colors: {
      primary: "#ef4444", // Red
      secondary: "#3b82f6", // Blue
      accent: "#ffffff", // White
      background: "#1e3a8a", // Dark Blue
      text: "#ffffff"
    },
    text: {
      heroTitle: "Independence",
      heroSubtitle: "Summer Freedom",
      heroTag: "Summer Sale",
      storyTag: "Patriot"
    },
    texture: "noise",
    animation: "marquee",
    fontMode: "default"
  },
  halloween: {
    id: "halloween",
    colors: {
      primary: "#f97316", // Orange
      secondary: "#9333ea", // Purple
      accent: "#22c55e", // Green (Slime)
      background: "#1a0b2e", // Dark Purple
      text: "#ffffff" // White Text for contrast
    },
    text: {
      heroTitle: "Spooky Season",
      heroSubtitle: "Haunted Art",
      heroTag: "Trick or Treat",
      storyTag: "Horror"
    },
    texture: "noise",
    animation: "glitch",
    fontMode: "default"
  },
  thanksgiving: {
    id: "thanksgiving",
    colors: {
      primary: "#d97706", // Amber
      secondary: "#78350f", // Brown
      accent: "#f59e0b", // Yellow
      background: "#451a03", // Dark Brown
      text: "#ffffff"
    },
    text: {
      heroTitle: "Thanksgiving",
      heroSubtitle: "Harvest Festival",
      heroTag: "Autumn Special",
      storyTag: "Seasonal"
    },
    texture: "dots",
    animation: "none",
    fontMode: "serif"
  },
  black_friday: {
    id: "black_friday",
    colors: {
      primary: "#ef4444", // Red
      secondary: "#000000",
      accent: "#ffffff",
      background: "#000000",
      text: "#ffffff"
    },
    text: {
      heroTitle: "Black Friday",
      heroSubtitle: "Mega Sale",
      heroTag: "Door Buster",
      storyTag: "Event"
    },
    texture: "scanlines",
    animation: "glitch",
    fontMode: "mono"
  }
};

