import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_CATALOG } from "@/__tests__/store-catalog";
import {
  ProductClient,
  inlineBuyIsAboveViewport,
} from "@/app/store/[id]/product-client";

const shop = vi.hoisted(() => ({
  addItem: vi.fn(),
  setIsCartOpen: vi.fn(),
  campaign: { isActive: false, name: "" } as Record<string, unknown>,
}));

vi.mock("@/context/cart-context", () => ({
  useCart: () => ({ addItem: shop.addItem, setIsCartOpen: shop.setIsCartOpen }),
}));

vi.mock("@/context/settings-context", () => ({
  useSettings: () => ({ campaign: shop.campaign }),
}));

vi.mock("@/components/reviews-section", () => ({
  ReviewsSection: () => <section aria-label="Reviews" />,
}));

const fantasy = MOCK_CATALOG.find((p) => p.category === "FANTASY")!;
const classics = MOCK_CATALOG.find((p) => p.category === "CLASSICS")!;
const scifi = MOCK_CATALOG.find((p) => p.subtitle === "Star Drifter")!;

beforeEach(() => {
  shop.addItem.mockReset();
  shop.setIsCartOpen.mockReset();
  shop.campaign = { isActive: false, name: "" };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderBook(product: typeof classics, samples = false) {
  return render(
    <ProductClient
      product={product}
      samples={samples}
      catalog={MOCK_CATALOG}
    />,
  );
}

describe("Product page", () => {
  it("renders the book's name, world, price and data-only details", () => {
    const { container } = renderBook(classics);

    const h1 = screen.getByRole("heading", { level: 1, name: "The Origin" });
    expect(h1).toHaveClass("font-display");
    expect(container.querySelectorAll(".font-display")).toHaveLength(1);
    expect(container.querySelector(".buyb .price")).toHaveTextContent(
      "Price $18.00",
    );

    const details = container.querySelector("dl")!;
    expect(
      [...details.querySelectorAll("dt")].map((dt) => dt.textContent),
    ).toEqual(["World", "Age"]);
    expect(details).toHaveTextContent("Classics");
    expect(details).toHaveTextContent("8+");
    expect(details).not.toHaveTextContent("Difficulty");
    expect(screen.queryByRole("heading", { name: "Look closer." })).toBeNull();
    const unlocks = container.querySelector(".unl")!;
    expect(unlocks.textContent).toMatch(/Pl\. 01a/);
    expect(unlocks.textContent).not.toMatch(/Pl\. 01b/);
    expect(container.textContent).not.toMatch(
      /in stock|96 pages|print \+ digital|ships|secure checkout|trophy|requisition|!/i,
    );
  });

  it("links back to the store and opens the three unlocks at /scan", () => {
    renderBook(classics);

    expect(screen.getByRole("link", { name: "All books" })).toHaveAttribute(
      "href",
      "/store",
    );
    const figures = screen.getAllByRole("link", {
      name: /registers your book|page code|colored page/,
    });
    expect(figures).toHaveLength(3);
    for (const figure of figures) {
      expect(figure).toHaveAttribute("href", "/scan");
    }
    expect(figures.map((figure) => figure.textContent)).toEqual([
      "QRQRThe QR registers your book.",
      "1pt1 ptA page code.",
      "2pts2 ptsA code plus a scan of the colored page.",
    ]);
    expect(
      screen.getByRole("link", { name: "Register a book" }),
    ).toHaveAttribute("href", "/scan");
  });

  it("adds to the cart and opens it, from the panel and the mobile bar", () => {
    shop.campaign = {
      isActive: true,
      name: "Spring",
      discount: {
        enabled: true,
        type: "percentage",
        value: 10,
        scope: "global",
      },
    };
    renderBook(classics);

    expect(document.querySelector(".buyb .price")).toHaveTextContent(
      "Price $16.20, was $18.00Spring",
    );
    const buttons = screen.getAllByRole("button", {
      name: "Add to cart: The Origin",
    });
    expect(buttons).toHaveLength(1);
    const bar = document.querySelector(".mbar") as HTMLElement;
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar).toHaveAttribute("inert");
    const barButton = bar.querySelector("button");
    expect(barButton).not.toBeNull();
    fireEvent.click(buttons[0]);
    expect(shop.addItem).toHaveBeenCalledWith({
      id: classics.id,
      title: "CLASSICS",
      price: 16.2,
      subtitle: "The Origin",
      image: undefined,
    });
    expect(shop.setIsCartOpen).toHaveBeenCalledWith(true);
    expect(screen.getByRole("status")).toHaveTextContent("In your cart.");

    fireEvent.click(barButton as HTMLButtonElement);
    expect(shop.addItem).toHaveBeenCalledTimes(2);
    expect(shop.setIsCartOpen).toHaveBeenCalledTimes(2);
  });

  it("shows the fixed buy bar whenever the inline box is above the viewport", () => {
    expect(inlineBuyIsAboveViewport({ bottom: 900, height: 80 })).toBe(false);
    expect(inlineBuyIsAboveViewport({ bottom: 0, height: 0 })).toBe(false);
    expect(inlineBuyIsAboveViewport({ bottom: -1, height: 80 })).toBe(true);

    const { container } = renderBook(classics);
    const panel = container.querySelector(".buyb") as HTMLElement;
    const bar = container.querySelector(".mbar") as HTMLElement;
    expect(bar.classList.contains("is-on")).toBe(false);

    const rect = {
      bottom: 900,
      height: 80,
      top: 820,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: 820,
      toJSON() {
        return this;
      },
    };
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue(rect as DOMRect);

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(bar.classList.contains("is-on")).toBe(false);

    rect.bottom = -1;
    rect.top = -81;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(bar.classList.contains("is-on")).toBe(true);
    expect(bar).not.toHaveAttribute("aria-hidden");

    rect.bottom = 2400;
    rect.top = 2320;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(bar.classList.contains("is-on")).toBe(false);

    rect.bottom = -40;
    rect.top = -120;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(bar.classList.contains("is-on")).toBe(true);
  });

  it("falls back to a labelled typographic cover in production", () => {
    const { container } = renderBook(scifi);

    expect(
      screen.getByRole("img", {
        name: "Star Drifter, Sci-fi coloring book, typographic cover",
      }),
    ).toBeInTheDocument();
    expect(
      [...container.querySelectorAll("img")].some((img) =>
        img.getAttribute("src")?.includes("/home/"),
      ),
    ).toBe(false);
    expect(screen.queryByText(/sample/i)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Look closer." })).toBeNull();
    expect(container.textContent).toMatch(/Vol 02/);
  });

  it("shows the sample world and inside pages, and letters a cover from another title", () => {
    const { container } = renderBook(scifi, true);

    expect(screen.queryByText("Sample cover · AI art")).toBeNull();
    expect(
      screen.getByRole("img", {
        name: "Star Drifter, Sci-fi coloring book, typographic cover",
      }),
    ).toBeInTheDocument();
    const images = [...container.querySelectorAll("img")].map((img) =>
      img.getAttribute("src"),
    );
    expect(images.some((src) => src?.includes("cover-scifi"))).toBe(false);
    expect(images.some((src) => src?.includes("/home/sample/"))).toBe(true);
    expect(images.some((src) => src?.includes("/home/page-line.webp"))).toBe(
      true,
    );
    expect(images.some((src) => src?.includes("/home/plate-color.webp"))).toBe(
      true,
    );
    expect(screen.getByRole("heading", { name: "Look closer." })).toHaveClass(
      "font-display",
    );
    const look = container.querySelector(".look") as HTMLElement;
    expect(within(look).getAllByText("Plate 07")).toHaveLength(2);
    expect(within(look).getByText("In line")).toBeInTheDocument();
    expect(within(look).getByText("Colored · Sample")).toBeInTheDocument();
    expect(container.textContent).toMatch(/Pl\. 01b/);
    expect(container.textContent).toMatch(/Vol 02/);
    expect(container.textContent).not.toMatch(/Vol 02 · Sample/);
  });

  it("shows only the spec fields a book has, and sizes the cover from its trim", () => {
    const { container } = renderBook({
      ...classics,
      lines: "The\nOrigin",
      pages: 40,
      sides: "single",
      trim: "8 × 10 in",
      binding: "Paperback",
      detail: 2,
    });

    expect(
      [...container.querySelectorAll("h1 span")].map(
        (span) => span.textContent,
      ),
    ).toEqual(["The", "Origin"]);
    expect(
      [...container.querySelectorAll("dl dt")].map((dt) => dt.textContent),
    ).toEqual(["World", "Plates", "Trim", "Binding", "Detail", "Age"]);
    expect(container.querySelector("dl")).toHaveTextContent(
      "40, printed single-sided",
    );
    expect(container.querySelector(".buyb .sl")).toHaveTextContent(
      "40 plates · 8 × 10 in · Paperback",
    );
    const frame = container.querySelector(".top .cover") as HTMLElement;
    expect(Number(frame.style.aspectRatio)).toBeCloseTo(8 / 10);
  });

  it("splits a title with no stored lines at the middle word break", () => {
    const pups = MOCK_CATALOG.find(
      (product) => product.subtitle === "Vacuum Pups",
    )!;
    const { container } = renderBook(pups);
    const title = container.querySelector(".top .s-h1") as HTMLElement;
    expect(title.querySelector(".one")).toHaveTextContent("Vacuum Pups");
    expect(
      [...title.querySelectorAll(".two span")].map((span) => span.textContent),
    ).toEqual(["Vacuum", "Pups"]);
    const main = container.querySelector("main") as HTMLElement;
    expect(main.style.getPropertyValue("--book-em")).not.toBe("");
    expect(main.style.getPropertyValue("--book-em-m")).not.toBe("");
    expect(Number(main.style.getPropertyValue("--book-em-m"))).toBeLessThan(
      Number(main.style.getPropertyValue("--book-em")),
    );
  });

  it("shows the first sentence, then only the rest of the description", () => {
    renderBook({
      ...scifi,
      description: "First sentence. The rest of it.",
    });

    expect(screen.getAllByText("First sentence.")).toHaveLength(1);
    expect(screen.getByText("The rest of it.")).toBeInTheDocument();
  });

  it("keeps Realm Walker lettered in production, with no Silver Citadel art", () => {
    const { container } = renderBook(fantasy);

    expect(container.querySelector(".top img")).toBeNull();
    expect(container.querySelector(".top .s-plate")).not.toBeNull();
    expect(screen.queryByText(/sample/i)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Look closer." })).toBeNull();
    const more = container.querySelector(".more") as HTMLElement;
    expect(
      within(more).queryByRole("link", { name: /Realm Walker/ }),
    ).toBeNull();
    expect(
      within(more).getByRole("link", { name: /Star Drifter/ }),
    ).toHaveAttribute("href", `/store/${scifi.id}`);
  });
});
