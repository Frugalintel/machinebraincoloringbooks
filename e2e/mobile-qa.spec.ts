import path from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const SHOTS = path.join(process.cwd(), "e2e", "screenshots");
const VIEWPORT = { width: 390, height: 844 };

test.use({ viewport: VIEWPORT });
test.describe.configure({ timeout: 90_000 });

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== "chromium", "390px shots are chromium-only");
});

async function shot(page: Page, testInfo: TestInfo, name: string) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

function fitsViewport(box: { x: number; width: number } | null) {
  expect(box).toBeTruthy();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    VIEWPORT.width + 1,
  );
}

async function expectHeaderSignIn(page: Page, next: string) {
  const signIn = page.locator("header").getByRole("link", { name: "Sign in" });
  await expect(signIn).toBeVisible();
  await expect(signIn).toHaveAttribute("href", `/auth?mode=login&next=${next}`);
  fitsViewport(await signIn.boundingBox());
}

test.describe("390px QA screens", () => {
  test("home headline and Sign in stay inside the viewport", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    fitsViewport(await heading.boundingBox());
    await expectHeaderSignIn(page, "%2F");
    await shot(page, testInfo, "home-390");

    await page.getByRole("button", { name: "Menu" }).click();
    const menuSignIn = page
      .getByRole("dialog", { name: /menu/i })
      .getByRole("link", { name: "Sign in" });
    await expect(menuSignIn).toBeVisible();
    fitsViewport(await menuSignIn.boundingBox());
    await shot(page, testInfo, "home-menu-390");
  });

  test("store headline and world chips stay inside the viewport", async ({
    page,
  }, testInfo) => {
    await page.goto("/store");
    const books = page.getByRole("heading", { name: "Books." });
    await expect(books).toBeVisible({ timeout: 20_000 });
    fitsViewport(await books.boundingBox());
    await expectHeaderSignIn(page, "%2Fstore");
    await shot(page, testInfo, "store-390");

    const chips = page.locator("#worlds");
    if (await chips.isVisible()) {
      await chips.scrollIntoViewIfNeeded();
      fitsViewport(await chips.boundingBox());
      await shot(page, testInfo, "store-chips-390");
    }
  });

  test("cart quantity controls are at least 44px", async ({
    page,
  }, testInfo) => {
    await page.goto("/store");
    await expect(page.getByRole("heading", { name: "Books." })).toBeVisible({
      timeout: 20_000,
    });

    const add = page.getByRole("button", { name: /Add to cart/ }).first();
    await expect(add).toBeVisible({ timeout: 15_000 });
    await add.click();
    const cartHeading = page.getByRole("heading", { name: "CART" });
    await expect(cartHeading).toBeVisible();
    await expect
      .poll(async () => (await cartHeading.boundingBox())?.x ?? 999)
      .toBeLessThan(40);

    const decrease = page.getByRole("button", { name: /Decrease quantity/ });
    const decBox = await decrease.boundingBox();
    expect(decBox?.width).toBeGreaterThanOrEqual(44);
    expect(decBox?.height).toBeGreaterThanOrEqual(44);
    await shot(page, testInfo, "cart-drawer-390");

    await page.getByRole("button", { name: "Close cart" }).click();
    await expect(page.getByRole("heading", { name: "CART" })).toHaveCount(0);
  });

  test("scan camera and page-code actions stay inside the viewport", async ({
    page,
  }, testInfo) => {
    await page.goto("/scan");
    const typeCode = page.getByRole("button", { name: /Type a page code/ });
    await expect(typeCode).toBeVisible({ timeout: 20_000 });
    fitsViewport(await typeCode.boundingBox());
    await expectHeaderSignIn(page, "%2Fscan");
    await shot(page, testInfo, "scan-390");
  });

  test("404 headline stays inside the viewport", async ({ page }, testInfo) => {
    await page.goto("/this-page-is-not-in-the-catalog");
    const notFound = page.getByRole("heading", { name: "Page not found" });
    await expect(notFound).toBeVisible();
    fitsViewport(await notFound.boundingBox());
    await expectHeaderSignIn(
      page,
      encodeURIComponent("/this-page-is-not-in-the-catalog"),
    );
    await shot(page, testInfo, "404-390");
  });
});

async function visibleBox(
  locator: ReturnType<Page["locator"]>,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const box = await locator.nth(index).boundingBox();
    if (box && box.width > 1 && box.height > 1) return box;
  }
  return null;
}

for (const width of [390, 360] as const) {
  test.describe(`header clearance at ${width}`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("Sign in stays clear of the wordmark", async ({ page }, testInfo) => {
      const pages = [
        { path: "/", slug: "home", next: "%2F" },
        { path: "/store", slug: "store", next: "%2Fstore" },
        { path: "/about", slug: "about", next: "%2Fabout" },
        { path: "/help", slug: "help", next: "%2Fhelp" },
      ] as const;

      for (const entry of pages) {
        await page.goto(entry.path);
        const signIn = page
          .locator("header")
          .getByRole("link", { name: "Sign in" });
        await expect(signIn).toBeVisible();
        await expect(signIn).toHaveAttribute(
          "href",
          `/auth?mode=login&next=${entry.next}`,
        );
        const word = await visibleBox(
          page.locator("header").getByRole("link", { name: "Machine Brain" }),
        );
        const sign = await signIn.boundingBox();
        expect(word).toBeTruthy();
        expect(sign).toBeTruthy();
        const gap = (sign?.x ?? 0) - ((word?.x ?? 0) + (word?.width ?? 0));
        expect(gap).toBeGreaterThan(0);
        expect((sign?.x ?? 0) + (sign?.width ?? 0)).toBeLessThanOrEqual(
          width + 1,
        );
        await shot(page, testInfo, `header-${entry.slug}-${width}`);

        if (entry.path === "/store") {
          const add = page.getByRole("button", { name: /Add to cart/ }).first();
          await expect(add).toBeVisible({ timeout: 15_000 });
          await add.click();
          await page.getByRole("button", { name: "Close cart" }).click();
          await expect(page.getByRole("heading", { name: "CART" })).toHaveCount(
            0,
          );
          const cart = page.locator("header").getByRole("button", {
            name: /Cart/,
          });
          const pill = await cart.locator("span").first().boundingBox();
          const hit = await cart.boundingBox();
          expect(pill?.height).toBeGreaterThanOrEqual(30);
          expect(pill?.height).toBeLessThanOrEqual(34);
          expect(hit?.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
}
