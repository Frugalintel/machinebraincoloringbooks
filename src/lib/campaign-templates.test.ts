import { describe, expect, it } from "vitest";
import {
  BRAND_CAMPAIGN_TEMPLATE,
  CAMPAIGN_TEMPLATES,
  REMOVED_CAMPAIGN_TEMPLATE_IDS,
  getCampaignTemplate,
  resolveCampaignTheme,
} from "@/lib/campaign-templates";

describe("campaign template fallback", () => {
  it("exposes only the brand template for pickers", () => {
    expect(Object.keys(CAMPAIGN_TEMPLATES)).toEqual(["brand"]);
    expect(CAMPAIGN_TEMPLATES.brand.id).toBe("brand");
    expect(CAMPAIGN_TEMPLATES.brand.colors).toEqual({
      primary: "#FF4F00",
      secondary: "#21211F",
      accent: "#F2EAD8",
      background: "#0F0F0F",
      text: "#F2EAD8",
    });
  });

  it("falls back to brand for removed and unknown ids", () => {
    for (const id of REMOVED_CAMPAIGN_TEMPLATE_IDS) {
      expect(getCampaignTemplate(id)).toBe(BRAND_CAMPAIGN_TEMPLATE);
    }

    expect(getCampaignTemplate("not-a-template")).toBe(BRAND_CAMPAIGN_TEMPLATE);
    expect(getCampaignTemplate(undefined)).toBe(BRAND_CAMPAIGN_TEMPLATE);
    expect(
      resolveCampaignTheme({
        id: "christmas",
        colors: {
          primary: "#dc2626",
          secondary: "#166534",
          accent: "#fbbf24",
          background: "#0f172a",
          text: "#ffffff",
        },
        text: {
          heroTitle: "Holiday Event",
          heroSubtitle: "Season of Art",
          heroTag: "Holiday Special",
          storyTag: "Holiday",
        },
      }),
    ).toBe(BRAND_CAMPAIGN_TEMPLATE);
  });
});
