/**
 * Centralized price calculation utility.
 * This replaces duplicated price calculation logic across:
 * - src/components/hero.tsx
 * - src/components/store-section.tsx
 * - src/app/store/page.tsx
 * - src/app/store/[id]/page.tsx
 */

import { CampaignSettings, Product } from './types';

interface PriceCalculationResult {
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
  savings: number;
}

/**
 * Calculate the final price for a product based on campaign settings and product discount.
 * Combines product-specific discounts with global campaign discounts.
 * 
 * @param product - The product to calculate price for
 * @param campaign - Optional campaign settings with global discounts
 * @returns Price calculation result with original, final price, and discount info
 */
export function calculatePrice(
  product: Pick<Product, 'price' | 'discount_percent'>,
  campaign?: CampaignSettings | null
): PriceCalculationResult {
  const originalPrice = product.price;
  let discountPercent = product.discount_percent || 0;
  
  // Apply campaign discount if active
  if (campaign?.discount?.enabled && campaign.discount.type === 'percentage') {
    // Combine product and campaign discounts (not stacking, use the higher one)
    const campaignDiscount = campaign.discount.value;
    discountPercent = Math.max(discountPercent, campaignDiscount);
  }
  
  const hasDiscount = discountPercent > 0;
  const discountMultiplier = (100 - discountPercent) / 100;
  const finalPrice = Math.round(originalPrice * discountMultiplier * 100) / 100;
  const savings = Math.round((originalPrice - finalPrice) * 100) / 100;
  
  return {
    originalPrice,
    finalPrice,
    discountPercent,
    hasDiscount,
    savings
  };
}

/**
 * Calculate the final price for a product with just campaign discount.
 * Used when we only have campaign settings (no product-specific discount).
 */
export function calculateCampaignPrice(
  originalPrice: number,
  campaign?: CampaignSettings | null
): PriceCalculationResult {
  return calculatePrice({ price: originalPrice, discount_percent: 0 }, campaign);
}

/**
 * Format a price for display.
 * 
 * @param price - The price to format
 * @returns Formatted price string (e.g., "$19.99")
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Format a discount percentage for display.
 * 
 * @param percent - The discount percentage
 * @returns Formatted discount string (e.g., "-20%")
 */
export function formatDiscount(percent: number): string {
  return `-${Math.round(percent)}%`;
}
