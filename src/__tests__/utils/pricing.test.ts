import { describe, it, expect } from "vitest";
import {
  calculatePrice,
  formatPrice,
  formatDiscount,
  calculateCampaignPrice,
} from "@/lib/pricing";
import { CampaignSettings } from "@/lib/types";

describe("pricing utilities", () => {
  describe("calculatePrice", () => {
    it("should return original price when no discount", () => {
      const product = { price: 19.99, discount_percent: 0 };
      const result = calculatePrice(product);

      expect(result.originalPrice).toBe(19.99);
      expect(result.finalPrice).toBe(19.99);
      expect(result.hasDiscount).toBe(false);
      expect(result.discountPercent).toBe(0);
    });

    it("should apply product discount", () => {
      const product = { price: 20, discount_percent: 25 };
      const result = calculatePrice(product);

      expect(result.originalPrice).toBe(20);
      expect(result.finalPrice).toBe(15);
      expect(result.hasDiscount).toBe(true);
      expect(result.discountPercent).toBe(25);
      expect(result.savings).toBe(5);
    });

    it("should apply campaign discount when active", () => {
      const product = { price: 100, discount_percent: 0 };
      const campaign: CampaignSettings = {
        isActive: true,
        name: "Test Campaign",
        discount: {
          enabled: true,
          type: "percentage",
          value: 20,
          scope: "global",
        },
        banner: {
          enabled: false,
          text: "",
          link: "",
          backgroundColor: "",
          textColor: "",
        },
      };

      const result = calculatePrice(product, campaign);

      expect(result.finalPrice).toBe(80);
      expect(result.discountPercent).toBe(20);
      expect(result.hasDiscount).toBe(true);
    });

    it("should use higher discount when both product and campaign have discounts", () => {
      const product = { price: 100, discount_percent: 10 };
      const campaign: CampaignSettings = {
        isActive: true,
        name: "Test Campaign",
        discount: {
          enabled: true,
          type: "percentage",
          value: 25,
          scope: "global",
        },
        banner: {
          enabled: false,
          text: "",
          link: "",
          backgroundColor: "",
          textColor: "",
        },
      };

      const result = calculatePrice(product, campaign);

      expect(result.discountPercent).toBe(25); // Uses higher campaign discount
      expect(result.finalPrice).toBe(75);
    });

    it("should not apply campaign discount when disabled", () => {
      const product = { price: 100, discount_percent: 10 };
      const campaign: CampaignSettings = {
        isActive: true,
        name: "Test Campaign",
        discount: {
          enabled: false, // Disabled
          type: "percentage",
          value: 25,
          scope: "global",
        },
        banner: {
          enabled: false,
          text: "",
          link: "",
          backgroundColor: "",
          textColor: "",
        },
      };

      const result = calculatePrice(product, campaign);

      expect(result.discountPercent).toBe(10); // Only product discount
      expect(result.finalPrice).toBe(90);
    });
  });

  describe("formatPrice", () => {
    it("should format price with two decimal places", () => {
      expect(formatPrice(19.99)).toBe("$19.99");
      expect(formatPrice(20)).toBe("$20.00");
      expect(formatPrice(9.9)).toBe("$9.90");
    });
  });

  describe("formatDiscount", () => {
    it("should format discount with minus sign", () => {
      expect(formatDiscount(20)).toBe("-20%");
      expect(formatDiscount(25.5)).toBe("-26%"); // Rounds
    });
  });

  describe("calculateCampaignPrice", () => {
    it("should work with just a price value", () => {
      const result = calculateCampaignPrice(50);

      expect(result.originalPrice).toBe(50);
      expect(result.finalPrice).toBe(50);
      expect(result.hasDiscount).toBe(false);
    });
  });
});
