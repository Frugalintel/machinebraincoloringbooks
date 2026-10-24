import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_CATALOG } from "@/__tests__/store-catalog";
import { StoreListing } from "@/app/store/store-listing";
import { fetchPublishedProducts } from "@/lib/products";
import { products as savedCatalog } from "@/lib/store-data";

const shop = vi.hoisted(() => ({
  params: new URLSearchParams(),
  addItem: vi.fn(),
  discount: { enabled: false, percentage: 0, label: "" },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => shop.params,
  usePathname: () => "/store",
}));

vi.mock("@/context/cart-context", () => ({
  useCart: () => ({ addItem: shop.addItem }),
}));

vi.mock("@/context/settings-context", () => ({
  useSettings: () => ({ globalDiscount: shop.discount }),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

vi.mock("@/lib/products", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/products")>()),
  fetchPublishedProducts: vi.fn(),
}));

const fetchMock = vi.mocked(fetchPublishedProducts);

async function renderStore({
  query = "",
  samples = false,
}: { query?: string; samples?: boolean } = {}) {
  shop.params = new URLSearchParams(query);
  const view = render(<StoreListing samples={samples} />);
  await waitFor(() =>
    expect(view.container.querySelector("main[aria-busy]")).toBeNull(),
  );
  return view;
}

function cards() {
  return within(screen.getByRole("region", { name: "Books" }))
    .getAllByRole("listitem")
    .filter((item) => item.querySelector(".s-buy"));
}

beforeEach(() => {
  shop.addItem.mockReset();
  shop.discount = { enabled: false, percentage: 0, label: "" };
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ data: MOCK_CATALOG, error: null });
});

describe("Store listing", () => {
  it("renders every live book with its real title, world and price", async () => {
    await renderStore();

    expect(
      screen.getByRole("heading", { level: 1, name: "All books" }),
    ).toHaveClass("font-display");
    expect(cards()).toHaveLength(MOCK_CATALOG.length);
    expect(screen.getByText("9 books")).toBeInTheDocument();

    const flora = screen.getByRole("link", { name: /Flora/ });
    expect(flora).toHaveAttribute(
      "href",
      "/store/10000000-0000-0000-0000-000000000008",
    );
    expect(flora.closest("li")!.querySelector(".s-price")).toHaveTextContent(
      "Price $13.00",
    );
    expect(flora.querySelector(".s-cap")).toHaveTextContent(
      "Pl. 01hFloraNature",
    );
  });

  it("adds a book to the cart with the same payload as before", async () => {
    await renderStore();

    fireEvent.click(
      screen.getByRole("button", { name: "Add to cart: Night Terror" }),
    );
    expect(shop.addItem).toHaveBeenCalledWith({
      id: "10000000-0000-0000-0000-000000000003",
      title: "HORROR",
      price: 6.66,
      subtitle: "Night Terror",
      image: undefined,
    });
  });

  it("applies the global discount and shows the old price struck through", async () => {
    shop.discount = { enabled: true, percentage: 50, label: "Half off" };
    await renderStore({ query: "world=classics" });

    const card = cards()[0];
    expect(card.querySelector(".s-price")).toHaveTextContent(
      "Price $9.00, was $18.00",
    );
  });

  it("filters by ?world= and marks the active world", async () => {
    await renderStore({ query: "world=sci-fi" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Sci-fi" }),
    ).toBeInTheDocument();
    expect(
      cards().map((card) => within(card).getByRole("link").textContent),
    ).toEqual([
      expect.stringContaining("Star Drifter"),
      expect.stringContaining("Iron Giant"),
    ]);
    const filter = screen.getByRole("navigation", { name: "World filter" });
    expect(
      within(filter).getByRole("link", { name: "Sci-fi" }),
    ).toHaveAttribute("aria-current", "page");
    expect(within(filter).getByRole("link", { name: "All" })).toHaveAttribute(
      "href",
      "/store",
    );
  });

  it("shows the empty state for a world with no books", async () => {
    await renderStore({ query: "world=surreal" });

    expect(
      screen.getByRole("heading", { name: "No books in this world yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all books" })).toHaveAttribute(
      "href",
      "/store",
    );
    expect(screen.queryByRole("button", { name: /Add to cart/ })).toBeNull();
  });

  it("keeps the saved catalog on screen when the live load fails, with a cream retry", async () => {
    fetchMock.mockResolvedValueOnce({
      data: null,
      error: { message: "down" } as never,
    });
    await renderStore();

    expect(cards()).toHaveLength(savedCatalog.length);
    const notice = screen
      .getByText("The live catalog did not load")
      .closest(".s-notice") as HTMLElement;
    expect(notice.className).not.toMatch(/signal|danger|primary/);

    fireEvent.click(within(notice).getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.queryByText("The live catalog did not load")).toBeNull(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cards()).toHaveLength(MOCK_CATALOG.length);
  });

  it("letters every cover in production, with no art borrowed from Home", async () => {
    const { container } = await renderStore({ samples: false });

    expect(container.querySelectorAll(".s-plate")).toHaveLength(
      MOCK_CATALOG.length,
    );
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(screen.queryByText("Sample")).toBeNull();
  });

  it("labels Studio's SAMPLE covers on previews", async () => {
    const { container } = await renderStore({ samples: true });

    const sampled = [...container.querySelectorAll("img")].filter((img) =>
      img.getAttribute("src")!.startsWith("/home/sample/"),
    );
    expect(sampled.length).toBeGreaterThan(0);
    for (const img of sampled) {
      expect(img.parentElement!.querySelector(".s-tag")).toHaveTextContent(
        "Sample",
      );
    }
    expect(screen.getAllByText("Cover art · Sample").length).toBeGreaterThan(0);
  });

  it("shows no ratings, stock or invented counts", async () => {
    const { container } = await renderStore();
    expect(container.textContent).not.toMatch(
      /in stock|review|rating|bestsell|vol\. 0|pages|!/i,
    );
  });
});
