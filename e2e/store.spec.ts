import { test, expect } from "@playwright/test";

test.describe("Store", () => {
  test("should display the store page", async ({ page }) => {
    await page.goto("/store");

    // Check page title or heading
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("should navigate to product detail page", async ({ page }) => {
    await page.goto("/store");

    // Wait for products to load
    await page.waitForTimeout(1000);

    // Click on first product link
    const productLink = page.locator('a[href^="/store/"]').first();
    if (await productLink.isVisible()) {
      await productLink.click();

      // Should be on product page
      await expect(page).toHaveURL(/\/store\/.+/);
    }
  });

  test("should add product to cart", async ({ page }) => {
    await page.goto("/store");

    // Wait for products to load
    await page.waitForTimeout(1000);

    // Look for add to cart button
    const addButton = page
      .locator("button")
      .filter({ hasText: /add|cart/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();

      // Cart should open or show confirmation
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Navigation", () => {
  test("should navigate to home page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Machine Brain/i);
  });

  test("should navigate to stories page", async ({ page }) => {
    await page.goto("/stories");

    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("should navigate to achievements page", async ({ page }) => {
    await page.goto("/achievements");

    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
