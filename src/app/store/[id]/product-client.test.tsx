import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_CATALOG } from "@/__tests__/store-catalog";
import { ProductClient } from "@/app/store/[id]/product-client";

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

describe("Product page", () => {
  it("renders the book's name, world, price and data-only details", () => {
    const { container } = render(<ProductClient product={classics} />);

    const h1 = screen.getByRole("heading", { level: 1, name: "The Origin" });
    expect(h1).toHaveClass("font-display");
    expect(container.querySelectorAll(".font-display")).toHaveLength(1);
    expect(container.querySelector(".sp-price")).toHaveTextContent(
      "Price $18.00",
    );

    const details = container.querySelector("dl")!;
    expect(
      [...details.querySelectorAll("dt")].map((dt) => dt.textContent),
    ).toEqual(["World", "Age", "Difficulty"]);
    expect(details).toHaveTextContent("Classics");
    expect(details).toHaveTextContent("3 of 5");
    expect(container.textContent).not.toMatch(
      /in stock|96 pages|print \+ digital|ships|secure checkout|trophy|requisition|!/i,
    );
  });

  it("links back through a breadcrumb instead of history", () => {
    render(<ProductClient product={classics} />);

    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumb).getByRole("link", { name: "Store" })).toHaveAttribute(
      "href",
      "/store",
    );
    expect(
      within(crumb).getByRole("link", { name: "Classics" }),
    ).toHaveAttribute("href", "/store?world=classics");
    expect(within(crumb).getByText("The Origin")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("adds to the cart and opens it, as before", () => {
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
    render(<ProductClient product={classics} />);

    expect(document.querySelector(".sp-price")).toHaveTextContent(
      "SpringPrice $16.20, was $18.00",
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(shop.addItem).toHaveBeenCalledWith({
      id: classics.id,
      title: "CLASSICS",
      price: 16.2,
      subtitle: "The Origin",
      image: undefined,
    });
    expect(shop.setIsCartOpen).toHaveBeenCalledWith(true);
  });

  it("falls back to a labelled typographic cover in production", () => {
    const { container } = render(<ProductClient product={scifi} />);

    expect(
      screen.getByRole("img", {
        name: "Star Drifter, Sci-fi coloring book, typographic cover",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector(".sp-thumbs")).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(screen.queryByText(/sample/i)).toBeNull();
  });

  it("adds Studio's SAMPLE world plate on previews, labelled", () => {
    render(<ProductClient product={scifi} samples />);

    const thumbs = screen.getAllByRole("button", { name: /^Show / });
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(thumbs[1]);
    expect(thumbs[1]).toHaveAttribute("aria-pressed", "true");

    const main = document.querySelector(".sp-gallery > .cover")!;
    expect(main.querySelector("img")!.getAttribute("src")).toMatch(
      /^\/home\/sample\//,
    );
    expect(main.querySelector(".s-tag")).toHaveTextContent("Sample");
    expect(screen.getByText("Cover art · Sample")).toBeInTheDocument();
  });

  it("keeps Realm Walker lettered in production, with no Silver Citadel art", () => {
    render(<ProductClient product={fantasy} />);

    expect(document.querySelector(".sp-gallery img")).toBeNull();
    expect(document.querySelector(".sp-gallery .s-plate")).not.toBeNull();
    expect(screen.queryByRole("button", { name: /^Show / })).toBeNull();
    expect(screen.queryByText(/sample/i)).toBeNull();
  });
});
