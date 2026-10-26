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
  setIsCartOpen: vi.fn(),
  discount: { enabled: false, percentage: 0, label: "" },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => shop.params,
  usePathname: () => "/store",
}));

vi.mock("@/context/cart-context", () => ({
  useCart: () => ({
    addItem: shop.addItem,
    setIsCartOpen: shop.setIsCartOpen,
  }),
}));

vi.mock("@/context/settings-context", () => ({
  useSettings: () => ({ globalDiscount: shop.discount }),
}));

const auth = vi.hoisted(() => ({ isLoading: true }));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ isLoading: auth.isLoading }),
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

function indexSection() {
  return document.getElementById("ix")!.closest("section") as HTMLElement;
}

function rows() {
  return within(indexSection()).getAllByRole("listitem");
}

beforeEach(() => {
  shop.addItem.mockReset();
  shop.setIsCartOpen.mockReset();
  shop.discount = { enabled: false, percentage: 0, label: "" };
  auth.isLoading = true;
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ data: MOCK_CATALOG, error: null });
});

describe("Store listing auth independence", () => {
  it("renders books while auth is still hydrating", async () => {
    auth.isLoading = true;
    await renderStore();
    expect(fetchMock).toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { level: 1, name: "Books." }),
    ).toBeInTheDocument();
  });
});

describe("Store listing", () => {
  it("renders every live book with its real title, world and price", async () => {
    await renderStore();

    expect(
      screen.getByRole("heading", { level: 1, name: "Books." }),
    ).toHaveClass("font-display");
    expect(
      screen.getByRole("heading", { name: "Every book." }),
    ).toBeInTheDocument();
    expect(rows()).toHaveLength(MOCK_CATALOG.length);
    expect(document.querySelectorAll(".bk")).toHaveLength(MOCK_CATALOG.length);
    expect(screen.queryByText(/\d+ books/)).toBeNull();

    const flora = within(indexSection()).getByRole("link", { name: /Flora/ });
    expect(flora).toHaveAttribute(
      "href",
      "/store/10000000-0000-0000-0000-000000000008",
    );
    expect(flora).toHaveTextContent("Price $13.00");
    expect(flora).toHaveTextContent("Pl. 01h");
    expect(flora).toHaveTextContent("Nature");
    expect(document.querySelector("main")?.getAttribute("style")).toMatch(
      /--fit-em:/,
    );
  });

  it("adds a book to the cart with the same payload as before", async () => {
    await renderStore();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Add to cart: Night Terror" })[0],
    );
    expect(shop.addItem).toHaveBeenCalledWith({
      id: "10000000-0000-0000-0000-000000000003",
      title: "HORROR",
      price: 6.66,
      subtitle: "Night Terror",
      image: undefined,
    });
    expect(shop.setIsCartOpen).toHaveBeenCalledWith(true);
  });

  it("applies the global discount and shows the old price struck through", async () => {
    shop.discount = { enabled: true, percentage: 50, label: "Half off" };
    await renderStore({ query: "world=classics" });

    expect(rows()[0]).toHaveTextContent("Price $9.00, was $18.00");
  });

  it("filters by ?world= and marks the active world", async () => {
    await renderStore({ query: "world=sci-fi" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Books." }),
    ).toBeInTheDocument();
    expect(rows().map((row) => row.textContent)).toEqual([
      expect.stringContaining("Star Drifter"),
      expect.stringContaining("Iron Giant"),
    ]);
    expect(document.querySelectorAll(".bk")).toHaveLength(2);
    const filter = screen.getByRole("group", { name: "World filter" });
    expect(
      within(filter).getByRole("link", { name: "Sci-fi" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(filter).getByRole("link", { name: "All" })).toHaveAttribute(
      "href",
      "/store",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Sci-fi");
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

    expect(rows()).toHaveLength(savedCatalog.length);
    const notice = screen
      .getByText("The live catalog did not load")
      .closest(".s-notice") as HTMLElement;
    expect(notice.className).not.toMatch(/signal|danger|primary/);

    fireEvent.click(within(notice).getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.queryByText("The live catalog did not load")).toBeNull(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rows()).toHaveLength(MOCK_CATALOG.length);
  });

  it("letters every cover in production, with no art borrowed from Home", async () => {
    const { container } = await renderStore({ samples: false });

    expect(container.querySelectorAll(".s-plate")).toHaveLength(
      MOCK_CATALOG.length * 3,
    );
    const art = [...container.querySelectorAll("img")].map((img) =>
      img.getAttribute("src"),
    );
    expect(art.some((src) => src?.startsWith("/home/"))).toBe(false);
    expect(screen.queryByText("Sample")).toBeNull();
  });

  it("letters every cover whose title has no matching sample", async () => {
    const { container } = await renderStore({ samples: true });

    expect(container.querySelectorAll(".s-plate")).toHaveLength(
      MOCK_CATALOG.length * 3,
    );
    const titled = [...container.querySelectorAll("img")].map(
      (img) => img.getAttribute("alt") ?? "",
    );
    for (const title of [
      "The Far Station",
      "The Silver Citadel",
      "The Wandering Keep",
      "Into the Deep Forest",
      "A Quiet Night In",
    ]) {
      expect(titled.some((alt) => alt.includes(title))).toBe(false);
    }
    expect(screen.getAllByText("Sample titles and art").length).toBeGreaterThan(
      0,
    );
  });

  it("shows no ratings, stock or invented counts", async () => {
    const { container } = await renderStore();
    expect(container.textContent).not.toMatch(
      /in stock|review|rating|bestsell|vol\. 0|\d+ books|!/i,
    );
  });
});
