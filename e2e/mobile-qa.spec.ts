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
    const signIn = page
      .locator("header")
      .getByRole("link", { name: "Sign in" });
    const menu = page.getByRole("button", { name: "Menu" });
    const signBox = await signIn.boundingBox();
    const menuBox = await menu.boundingBox();
    const clusterGap =
      (menuBox?.x ?? 0) - ((signBox?.x ?? 0) + (signBox?.width ?? 0));
    expect(clusterGap).toBeGreaterThanOrEqual(14);
    const footerLink = page.locator(".home-e2 .cols a").first();
    await footerLink.scrollIntoViewIfNeeded();
    expect((await footerLink.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    const legalLink = page.locator(".home-e2 .legal a").first();
    await legalLink.scrollIntoViewIfNeeded();
    expect((await legalLink.boundingBox())?.height).toBeGreaterThanOrEqual(44);
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
    await expect(async () => {
      fitsViewport(await books.boundingBox());
    }).toPass();
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
    const remove = page.getByRole("button", { name: /Remove / });
    const removeBox = await remove.boundingBox();
    expect(removeBox?.width).toBeGreaterThanOrEqual(44);
    expect(removeBox?.height).toBeGreaterThanOrEqual(44);
    const closeBox = await page
      .getByRole("button", { name: "Close cart" })
      .boundingBox();
    expect(closeBox?.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByText("1 item", { exact: true })).toBeVisible();
    const scrollbar = await page.locator(".cart-scroll").evaluate((el) => {
      const style = getComputedStyle(el);
      return `${style.scrollbarColor} ${style.scrollbarWidth}`;
    });
    expect(scrollbar).toContain("242");
    expect(scrollbar).toContain("thin");
    await shot(page, testInfo, "cart-drawer-390");

    await page.getByRole("button", { name: "Close cart" }).click();
    await expect(page.getByRole("heading", { name: "CART" })).toHaveCount(0);
  });

  test("scan camera and page-code actions stay inside the viewport", async ({
    page,
  }, testInfo) => {
    await page.goto("/scan");
    const code = page.getByLabel("Page code");
    await expect(code).toBeVisible({ timeout: 20_000 });
    fitsViewport(await code.boundingBox());
    await expect(page.getByRole("heading", { name: "Scan." })).toBeVisible();
    await expect(page.getByText(/Camera off/)).toHaveCount(1);
    await page.getByLabel("Page code").press("Enter");
    await expect(page.getByText("Type a code first.")).toBeVisible();
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
    const footerSignIn = page
      .locator("footer")
      .getByRole("link", { name: "Sign in" });
    await expect(footerSignIn).toHaveAttribute(
      "href",
      `/auth?mode=login&next=${encodeURIComponent("/this-page-is-not-in-the-catalog")}`,
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

const FILLED_CART = JSON.stringify([
  {
    id: "1",
    title: "Vacuum Pups",
    price: 12,
    quantity: 1,
  },
]);

for (const width of [390, 360] as const) {
  test.describe(`filled-cart header at ${width}`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("stays clear signed out and with a long account name", async ({
      page,
      context,
    }, testInfo) => {
      const pages = [
        { path: "/", slug: "home", next: "%2F" },
        { path: "/about", slug: "about", next: "%2Fabout" },
        { path: "/store", slug: "store", next: "%2Fstore" },
        {
          path: "/this-page-is-not-in-the-catalog",
          slug: "404",
          next: "%2Fthis-page-is-not-in-the-catalog",
        },
      ] as const;

      await context.addInitScript((cart) => {
        window.localStorage.setItem("machine-brain-cart", cart);
      }, FILLED_CART);

      const assertClear = async (
        slug: string,
        next: string,
        state: "out" | "name",
      ) => {
        const header = page.locator("header");
        const account = header.locator("a, button").filter({
          hasText: /Sign in|Ada Lovelace/,
        });
        await expect(account.first()).toBeVisible();
        if (state === "out") {
          await expect(account.first()).toHaveAttribute(
            "href",
            `/auth?mode=login&next=${next}`,
          );
        }
        const cart = header.getByRole("button", { name: /Cart, 1 item/ });
        const pill = await cart.locator("span").first().boundingBox();
        const hit = await cart.boundingBox();
        expect(pill?.height).toBeGreaterThanOrEqual(30);
        expect(pill?.height).toBeLessThanOrEqual(34);
        expect(hit?.height).toBeGreaterThanOrEqual(44);
        const word = await visibleBox(
          header.getByRole("link", { name: "Machine Brain" }),
        );
        const accountBox = await account.first().boundingBox();
        const menu = await header
          .getByRole("button", { name: "Menu" })
          .boundingBox();
        expect(word).toBeTruthy();
        expect(accountBox).toBeTruthy();
        expect(menu).toBeTruthy();
        const gap =
          (accountBox?.x ?? 0) - ((word?.x ?? 0) + (word?.width ?? 0));
        console.warn(
          `MEASURE filled-cart ${slug} ${width} ${state} gap=${Math.round(gap)} menuInset=${Math.round(width - ((menu?.x ?? 0) + (menu?.width ?? 0)))}`,
        );
        expect(gap).toBeGreaterThanOrEqual(6);
        expect((menu?.x ?? 0) + (menu?.width ?? 0)).toBeLessThanOrEqual(
          width - 20 + 1,
        );
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth + 1,
          ),
        ).toBe(true);
        await shot(page, testInfo, `header-${slug}-${width}-${state}`);
      };

      for (const entry of pages) {
        await page.goto(entry.path);
        await expect(
          page.locator("header").getByRole("button", { name: /Cart, 1 item/ }),
        ).toBeVisible();
        await assertClear(entry.slug, entry.next, "out");
        await page.evaluate(() => {
          const link = document.querySelector(
            'header a[href*="mode=login"]',
          ) as HTMLAnchorElement | null;
          if (!link) return;
          link.textContent = "Ada Lovelace the Collector";
          const narrow = window.matchMedia("(max-width: 400px)").matches;
          const mid = window.matchMedia("(max-width: 760px)").matches;
          link.style.maxWidth = narrow ? "3rem" : mid ? "4.5rem" : "9rem";
          link.style.overflow = "hidden";
          link.style.textOverflow = "ellipsis";
          link.style.whiteSpace = "nowrap";
        });
        await assertClear(entry.slug, entry.next, "name");
      }
    });
  });
}

type HeaderClearance = {
  width: number;
  path: string;
  cart: "empty" | "filled";
  auth: "out" | "in";
  wordmark: string;
  fontSize: string;
  tracking: string;
  gap: number;
  menuRight: number;
  menuInset: number;
  clientWidth: number;
  scroll: boolean;
};

async function readHeaderClearance(
  page: Page,
  row: Pick<HeaderClearance, "width" | "path" | "cart" | "auth">,
): Promise<HeaderClearance> {
  const measured = await page.evaluate(() => {
    const header = document.querySelector("header");
    const word = header?.querySelector(
      'a[aria-label="Machine Brain"] .uppercase',
    );
    const lockup = header?.querySelector('a[aria-label="Machine Brain"]');
    const account = header?.querySelector(
      'a[href*="mode=login"], button[aria-label^="Account"]',
    );
    const menu = header?.querySelector("button[aria-controls]");
    const miss = [
      word instanceof HTMLElement ? "" : "word",
      lockup instanceof HTMLElement ? "" : "lockup",
      account instanceof HTMLElement ? "" : "account",
      menu instanceof HTMLElement ? "" : "menu",
    ].filter(Boolean);
    if (miss.length > 0) {
      return {
        missing: miss.join(","),
        html: header?.innerHTML.slice(0, 1500) ?? "no-header",
      };
    }
    const wordEl = word as HTMLElement;
    const lockupEl = lockup as HTMLElement;
    const accountEl = account as HTMLElement;
    const menuEl = menu as HTMLElement;
    const wordStyle = getComputedStyle(wordEl);
    const wordBox = wordEl.getBoundingClientRect();
    const lockupBox = lockupEl.getBoundingClientRect();
    const accountBox = accountEl.getBoundingClientRect();
    const menuBox = menuEl.getBoundingClientRect();
    const visible = wordStyle.display !== "none" && wordBox.width > 0;
    const brandRight = visible ? wordBox.right : lockupBox.right;
    const clientWidth = document.documentElement.clientWidth;
    return {
      wordmark: wordStyle.display,
      fontSize: wordStyle.fontSize,
      tracking: wordStyle.letterSpacing,
      gap: accountBox.left - brandRight,
      menuRight: menuBox.right,
      menuInset: clientWidth - menuBox.right,
      clientWidth,
      scroll:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    };
  });
  if (!measured || "missing" in measured) {
    console.warn(measured && "html" in measured ? measured.html : "no measure");
    throw new Error(
      measured && "missing" in measured ? measured.missing : "no measure",
    );
  }
  return { ...row, ...measured };
}

test.describe("header clearance", () => {
  test("keeps the wordmark clear at the narrow widths", async ({ page }) => {
    test.setTimeout(180_000);
    const rows: HeaderClearance[] = [];
    for (const width of [320, 340, 360, 375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ["/", "/about"]) {
        for (const cart of ["empty", "filled"] as const) {
          await page.goto(path);
          await page.evaluate(
            ({ filled, cartJson }) => {
              if (filled) {
                window.localStorage.setItem("machine-brain-cart", cartJson);
              } else {
                window.localStorage.removeItem("machine-brain-cart");
              }
            },
            { filled: cart === "filled", cartJson: FILLED_CART },
          );
          await page.reload();
          await page.evaluate(() => document.fonts.ready);
          const header = page.locator("header");
          await expect(
            header.getByRole("link", { name: "Machine Brain" }),
          ).toBeVisible();
          await expect(
            header.getByRole("link", { name: "Sign in" }),
          ).toBeVisible();
          const base = { width, path, cart };
          rows.push(await readHeaderClearance(page, { ...base, auth: "out" }));
          // Supabase is unreachable here. Apply the signed-in max-width caps
          // from account-menu: 3rem filled and 4.25rem empty at ≤400px.
          await page.evaluate((filled) => {
            const link = document.querySelector('header a[href*="mode=login"]');
            if (!(link instanceof HTMLElement)) return;
            link.textContent = "Ada Lovelace the Collector";
            const narrow = window.matchMedia("(max-width: 400px)").matches;
            const mid = window.matchMedia("(max-width: 760px)").matches;
            link.style.maxWidth = narrow
              ? filled
                ? "3rem"
                : "4.25rem"
              : mid
                ? "4.5rem"
                : "9rem";
            link.style.overflow = "hidden";
            link.style.textOverflow = "ellipsis";
            link.style.whiteSpace = "nowrap";
          }, cart === "filled");
          rows.push(await readHeaderClearance(page, { ...base, auth: "in" }));
        }
      }
    }

    const tenth = (value: number) => Math.round(value * 10) / 10;
    for (const row of rows) {
      console.warn(
        `MEASURE header ${row.path} ${row.width} ${row.cart} ${row.auth} wordmark=${row.wordmark} font=${row.fontSize} tracking=${row.tracking} gap=${tenth(row.gap)} menuRight=${tenth(row.menuRight)} menuInset=${tenth(row.menuInset)} scroll=${row.scroll}`,
      );
    }
    for (const row of rows) {
      expect(row.gap).toBeGreaterThanOrEqual(6);
      expect(row.menuRight).toBeLessThanOrEqual(row.clientWidth - 20 + 1);
      expect(row.scroll).toBe(true);
      if (row.width < 340) expect(row.wordmark).toBe("none");
      else expect(row.wordmark).not.toBe("none");
      const font = Number.parseFloat(row.fontSize);
      if (row.width >= 360) expect(font).toBe(11);
      else if (row.width >= 340) expect(font).toBe(10);
    }
  });
});

function rightInset(
  width: number,
  box: { x: number; width: number } | null,
): number {
  return width - ((box?.x ?? 0) + (box?.width ?? 0));
}

for (const width of [1440, 1280, 390, 360] as const) {
  test.describe(`surface layout at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } });
    test.describe.configure({ timeout: 180_000 });

    test("keeps type, taps, and the store list inside the frame", async ({
      page,
    }, testInfo) => {
      const measures: Record<string, number | string | boolean> = { width };
      const noScroll = () =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        );

      await page.goto("/");
      await expect(page.locator("h1").first()).toBeVisible();
      measures.homeScroll = await noScroll();
      expect(measures.homeScroll).toBe(true);

      const header = page.locator("header");
      const word = await visibleBox(
        header.getByRole("link", { name: "Machine Brain" }),
      );
      const signIn = await header
        .getByRole("link", { name: "Sign in" })
        .boundingBox();
      const headerGap =
        (signIn?.x ?? 0) - ((word?.x ?? 0) + (word?.width ?? 0));
      measures.headerGap = Math.round(headerGap * 10) / 10;
      expect(headerGap).toBeGreaterThanOrEqual(6);
      const wordmark = await header
        .getByText("Machine Brain", { exact: true })
        .evaluate((el) => getComputedStyle(el).display);
      measures.wordmark = wordmark;
      if (width < 340) expect(wordmark).toBe("none");
      else expect(wordmark).not.toBe("none");

      if (width <= 760) {
        const menu = await header
          .getByRole("button", { name: "Menu" })
          .boundingBox();
        measures.menuRightInset = Math.round(rightInset(width, menu));
        if (width <= 400) {
          expect(rightInset(width, menu)).toBeGreaterThanOrEqual(19);
        }
        await page.getByRole("button", { name: "Menu" }).click();
        const menuCart = page
          .getByRole("dialog", { name: /menu/i })
          .getByRole("button", { name: /Cart, \d+ items/ });
        await expect(menuCart).toBeVisible();
        measures.menuCart = (await menuCart.innerText()).replace(/\s+/g, " ");
        await page.keyboard.press("Escape");
      }

      const codes = page.locator("#home-codes-h span");
      await codes.first().scrollIntoViewIfNeeded();
      const codeCount = await codes.count();
      let codesInset = Number.POSITIVE_INFINITY;
      for (let index = 0; index < codeCount; index += 1) {
        codesInset = Math.min(
          codesInset,
          rightInset(width, await codes.nth(index).boundingBox()),
        );
      }
      measures.codesInset = Math.round(codesInset);
      expect(codesInset).toBeGreaterThanOrEqual(16);

      const footerLink = page.locator(".home-e2 .cols a").first();
      await footerLink.scrollIntoViewIfNeeded();
      measures.footerLinkH = Math.round(
        (await footerLink.boundingBox())?.height ?? 0,
      );
      expect(measures.footerLinkH).toBeGreaterThanOrEqual(44);
      const legalLink = page.locator(".home-e2 .legal a").first();
      await legalLink.scrollIntoViewIfNeeded();
      measures.legalLinkH = Math.round(
        (await legalLink.boundingBox())?.height ?? 0,
      );
      expect(measures.legalLinkH).toBeGreaterThanOrEqual(44);

      await page.goto("/auth");
      const welcome = page.locator("main .sa-l", { hasText: "Welcome" });
      await expect(welcome).toBeVisible();
      measures.welcomeInset = Math.round(
        rightInset(width, await welcome.boundingBox()),
      );
      expect(measures.welcomeInset).toBeGreaterThanOrEqual(16);
      measures.authScroll = await noScroll();
      expect(measures.authScroll).toBe(true);

      await page.goto("/collectibles");
      const collectibles = page.getByRole("heading", { name: "Collectibles." });
      await expect(collectibles).toBeVisible({ timeout: 20_000 });
      measures.collectiblesMains = await page.locator("main").count();
      expect(measures.collectiblesMains).toBe(1);
      measures.collectiblesInset = Math.round(
        rightInset(width, await collectibles.boundingBox()),
      );
      expect(measures.collectiblesInset).toBeGreaterThanOrEqual(16);
      measures.collectiblesScroll = await noScroll();
      expect(measures.collectiblesScroll).toBe(true);

      await page.goto("/store");
      await expect(page.getByRole("heading", { name: "Books." })).toBeVisible({
        timeout: 20_000,
      });
      measures.storeListMin = await page.evaluate(() => {
        const host = document.querySelector(".store-e2");
        if (!host) return "missing";
        const probe = document.createElement("div");
        probe.className = "s-list";
        host.append(probe);
        const value = getComputedStyle(probe).minHeight;
        const live = document.querySelectorAll(".store-e2 .s-list").length - 1;
        probe.remove();
        return `${value} live=${live}`;
      });
      expect(
        String(measures.storeListMin).startsWith(
          width <= 760 ? "0px" : "760px",
        ),
      ).toBe(true);
      measures.storeHeroGap = await page.evaluate(() => {
        const hero = document.querySelector(".s-hero");
        const next = hero?.nextElementSibling;
        if (!hero || !next) return -1;
        return Math.round(
          next.getBoundingClientRect().top -
            hero.getBoundingClientRect().bottom,
        );
      });
      measures.storeChildGap = await page.evaluate(() => {
        const main = document.querySelector("main");
        if (!main) return -1;
        const kids = [...main.children].filter(
          (el) => el.getBoundingClientRect().height > 0,
        );
        let max = 0;
        for (let index = 0; index < kids.length - 1; index += 1) {
          const above = kids[index]?.getBoundingClientRect();
          const below = kids[index + 1]?.getBoundingClientRect();
          if (!above || !below) continue;
          max = Math.max(max, below.top - above.bottom);
        }
        return Math.round(max);
      });
      measures.storeScroll = await noScroll();
      expect(measures.storeScroll).toBe(true);

      await page.goto("/scan");
      await expect(page.getByLabel("Page code")).toBeVisible({
        timeout: 20_000,
      });
      measures.cameraOff = await page.getByText(/Camera off/).count();
      expect(measures.cameraOff).toBe(1);
      measures.scanScroll = await noScroll();
      expect(measures.scanScroll).toBe(true);

      await page.goto("/trophy-room");
      const gate = page.locator("main .shell-sub", {
        hasText: "Sign in to see",
      });
      await expect(gate).toBeVisible({ timeout: 20_000 });
      const gateBox = await gate.boundingBox();
      const gateButton = await page
        .locator("main")
        .getByRole("button", { name: "Sign in" })
        .boundingBox();
      measures.trophyGap = Math.round(
        (gateButton?.y ?? 0) - ((gateBox?.y ?? 0) + (gateBox?.height ?? 0)),
      );
      expect(measures.trophyGap).toBeGreaterThan(12);
      measures.trophyScroll = await noScroll();
      expect(measures.trophyScroll).toBe(true);

      await page.goto("/this-page-is-not-in-the-catalog");
      await expect(
        page.getByRole("heading", { name: "Page not found" }),
      ).toBeVisible();
      measures.notFoundChrome =
        (await page.locator("header").getAttribute("data-site-chrome")) ?? "";
      expect(measures.notFoundChrome).not.toBe("");
      measures.notFoundMains = await page.locator("main").count();
      expect(measures.notFoundMains).toBe(1);
      measures.notFoundScroll = await noScroll();
      expect(measures.notFoundScroll).toBe(true);

      console.warn(`MEASURE ${JSON.stringify(measures)}`);
      await testInfo.attach(`layout-${width}.json`, {
        body: JSON.stringify(measures, null, 2),
        contentType: "application/json",
      });
    });
  });
}
