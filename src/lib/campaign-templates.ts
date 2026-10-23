import { CampaignTheme } from "./types";

export const BRAND_CAMPAIGN_TEMPLATE_ID = "brand";

/** Template ids removed in F1. Stored campaign rows that still use these fall back to brand. */
export const REMOVED_CAMPAIGN_TEMPLATE_IDS = [
  "default",
  "cyberpunk",
  "retro_wave",
  "minimal",
  "christmas",
  "new_years",
  "valentines",
  "july_4th",
  "halloween",
  "thanksgiving",
  "black_friday",
] as const;

export type RemovedCampaignTemplateId =
  (typeof REMOVED_CAMPAIGN_TEMPLATE_IDS)[number];

export const BRAND_CAMPAIGN_TEMPLATE: CampaignTheme = {
  id: BRAND_CAMPAIGN_TEMPLATE_ID,
  name: "Brand",
  colors: {
    primary: "#FF4F00", // signal — labels and links only
    secondary: "#21211F", // surface-2
    accent: "#F2EAD8", // cream
    background: "#0F0F0F", // base
    text: "#F2EAD8", // cream
  },
  text: {
    heroTitle: "New Books",
    heroSubtitle: "Just dropped",
    heroTag: "New",
    storyTag: "Sci-Fi",
    heroDescription:
      "We make sci-fi coloring books. Each one has a hidden code inside. Enter it to read the story behind the art.",
  },
  texture: "none",
  animation: "none",
  fontMode: "default",
};

export const CAMPAIGN_TEMPLATES: Record<string, CampaignTheme> = {
  brand: BRAND_CAMPAIGN_TEMPLATE,
};

export function isRemovedCampaignTemplateId(
  id: string | null | undefined,
): id is RemovedCampaignTemplateId {
  return (
    typeof id === "string" &&
    (REMOVED_CAMPAIGN_TEMPLATE_IDS as readonly string[]).includes(id)
  );
}

/**
 * Resolve a stored or requested campaign template id.
 * Unknown and removed ids (including legacy `default`) fall back to brand.
 */
export function getCampaignTemplate(id?: string | null): CampaignTheme {
  if (id && CAMPAIGN_TEMPLATES[id]) {
    return CAMPAIGN_TEMPLATES[id];
  }
  return BRAND_CAMPAIGN_TEMPLATE;
}

/**
 * Normalize a theme object loaded from settings or Supabase.
 * Missing/removed ids become brand so stored seasonal rows do not break.
 */
export function resolveCampaignTheme(
  theme?: CampaignTheme | null,
): CampaignTheme {
  return getCampaignTemplate(theme?.id);
}
