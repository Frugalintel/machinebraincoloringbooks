import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { HOME_ART, SAMPLE_BOOKS } from "@/lib/home";
import { products as catalogProducts } from "@/lib/store-data";

vi.mock("@/lib/products", () => ({
  fetchPublishedProducts: vi.fn(async () => ({ data: null, error: null })),
}));

/** Routes that exist in src/app; home may link nowhere else. */
const REAL_ROUTES = [
  "/",
  "/store",
  "/stories",
  "/collectibles",
  "/trophy-room",
  "/scan",
  "/scan?mode=code",
  "/about",
  "/help",
  "/privacy",
  "/terms",
  "/licenses",
  "/auth?mode=login",
  "/auth?mode=register",
  "/auth?mode=login&next=%2F",
  "/auth?mode=register&next=%2F",
  "/orders/lookup",
];

function renderHome(vercelEnv: string) {
  vi.stubEnv("VERCEL_ENV", vercelEnv);
  return render(<Home />);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Home (R-E2 p3 Art book)", () => {
  it("sets one Redaction H1 over the O3 hero and the plates in order", () => {
    const { container } = renderHome("preview");

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Lookcloser.");
    expect(h1).toHaveClass("font-display");
    expect(container.querySelectorAll(".font-display")).toHaveLength(1);

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent?.replace(/\u00a0/g, " ")),
    ).toEqual([
      "Pick a world.",
      "Every pagehas a code.",
      "Points for every page",
      "Type it in.",
      "Step inside a world.",
    ]);

    const hero = screen.getByTestId("home-hero");
    const source = hero.querySelector("picture source");
    expect(source).toHaveAttribute("media", "(max-width: 760px)");
    expect(source?.getAttribute("srcset")).toContain(HOME_ART.heroMobile.src);
    const art = within(hero).getByRole("img");
    expect(art).toHaveAttribute("src", HOME_ART.heroDesktop.src);
    expect(art).toHaveAttribute("fetchpriority", "high");
    expect(art).toHaveAttribute("sizes", "100vw");
  });

  it("links only to real routes, never to #", () => {
    const { container } = renderHome("preview");
    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs.length).toBeGreaterThan(20);
    for (const href of hrefs) {
      expect(REAL_ROUTES).toContain(href);
    }
    expect(container.querySelector('a[href="#"], form[action="#"]')).toBeNull();
    expect(container.textContent).not.toMatch(/@sample|Instagram|Pinterest/);
  });

  it("submits the page code to /scan as mode=code&code=…", () => {
    renderHome("preview");
    const field = screen.getByLabelText("Page code");
    const form = field.closest("form")!;

    expect(form).toHaveAttribute("action", "/scan");
    expect(form).toHaveAttribute("method", "get");
    const mode = form.querySelector('input[type="hidden"]');
    expect(mode).toHaveAttribute("name", "mode");
    expect(mode).toHaveAttribute("value", "code");

    expect(field).toHaveAttribute("name", "code");
    expect(field).toBeRequired();
    expect(field).toHaveAttribute("autocapitalize", "characters");
    expect(field).toHaveAccessibleDescription(
      "From the foot of any page · sample format",
    );
    expect(within(form).getByRole("button", { name: "Enter" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("serves every raster through next/image with sizes", () => {
    const { container } = renderHome("preview");
    const images = [...container.querySelectorAll("img")].filter(
      (img) => !img.getAttribute("src")?.startsWith("/brand/"),
    );
    expect(images.length).toBeGreaterThan(10);
    for (const img of images) {
      const src = img.getAttribute("src") ?? "";
      if (src.includes("plate-line-cream")) {
        expect(img.getAttribute("sizes"), src).toBeNull();
        continue;
      }
      expect(img.getAttribute("sizes"), src).toBeTruthy();
    }
  });

  it("keeps orange to the hero plate dot, with no orange fills", () => {
    const { container } = renderHome("preview");
    const dots = container.querySelectorAll(".dot");
    expect(dots).toHaveLength(1);
    expect(screen.getByTestId("home-hero")).toContainElement(
      dots[0] as HTMLElement,
    );
    expect(
      container.querySelectorAll(
        '[class*="signal"], [class*="bg-primary"], [class*="brand-orange"]',
      ),
    ).toHaveLength(0);
  });
});

describe("Home SAMPLE flag", () => {
  it("shows Studio's labelled samples on previews", () => {
    const { container } = renderHome("preview");
    expect(container.firstElementChild).toHaveAttribute("data-samples", "on");

    const shop = screen
      .getByRole("heading", { name: "Pick a world." })
      .closest("section")!;
    for (const book of SAMPLE_BOOKS) {
      expect(within(shop).getByText(book.title)).toBeInTheDocument();
    }
    expect(screen.getByText("Cover art and titles · Sample")).toBeVisible();
    expect(screen.getByText("World plates · Sample art · AI")).toBeVisible();
    expect(screen.getByLabelText("New books by email")).toBeInTheDocument();
    expect(screen.getByLabelText("Page code")).toHaveAttribute(
      "placeholder",
      "• • • •",
    );
    expect(
      container.querySelectorAll('img[src^="/home/sample/"]').length,
    ).toBeGreaterThan(5);
  });

  it("falls back to real content in production", () => {
    const { container } = renderHome("production");
    expect(container.firstElementChild).toHaveAttribute("data-samples", "off");

    expect(container.textContent).not.toMatch(/sample/i);
    expect(container.textContent).not.toContain("•");
    expect(container.querySelector('img[src^="/home/sample/"]')).toBeNull();
    const shop = screen
      .getByRole("heading", { name: "Pick a world." })
      .closest("section")!;
    for (const book of SAMPLE_BOOKS) {
      expect(within(shop).queryByText(book.title)).toBeNull();
    }
    expect(
      within(shop).getByText(catalogProducts[0].subtitle!),
    ).toBeInTheDocument();
    expect(within(shop).getByText(/Vintage · \$/)).toBeInTheDocument();
    const shopArt = [...shop.querySelectorAll("img")].map((img) =>
      img.getAttribute("src"),
    );
    expect(new Set(shopArt)).toEqual(
      new Set([HOME_ART.color.src, HOME_ART.lineCream.src]),
    );

    const worlds = screen
      .getByRole("heading", { name: /Step inside a/ })
      .closest("section")!;
    expect(within(worlds).getByRole("img")).toHaveAttribute(
      "src",
      HOME_ART.color.src,
    );
    const strip = screen.getByRole("list", { name: "Worlds" });
    expect(strip.querySelector("img")).toBeNull();
    expect(within(strip).getAllByRole("link")).toHaveLength(5);

    expect(screen.queryByLabelText("New books by email")).toBeNull();
    const field = screen.getByLabelText("Page code");
    expect(field).not.toHaveAttribute("placeholder");
    expect(field).toHaveAccessibleDescription("From the foot of any page");
  });
});
