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
    }
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
    }
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
    }
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
    }
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
    }
  },
  halloween: {
    id: "halloween",
    colors: {
      primary: "#f97316", // Orange
      secondary: "#9333ea", // Purple
      accent: "#22c55e", // Green (Slime)
      background: "#1a0b2e", // Dark Purple
      text: "#f97316"
    },
    text: {
      heroTitle: "Spooky Season",
      heroSubtitle: "Haunted Art",
      heroTag: "Trick or Treat",
      storyTag: "Horror"
    }
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
    }
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
    }
  }
};

