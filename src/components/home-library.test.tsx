import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeLibrary, libraryTiles } from "@/components/home-library";
import { COVER_FRAME } from "@/lib/home";
import { fetchPublishedProducts } from "@/lib/products";
import { products as catalog } from "@/lib/store-data";
import type { Product } from "@/lib/types";

vi.mock("@/lib/products", () => ({
  fetchPublishedProducts: vi.fn(),
}));

const fetchMock = vi.mocked(fetchPublishedProducts);

const live: Product = {
  ...catalog[0],
  id: "c0ffee",
  title: "GARDEN",
  subtitle: "THE SECRET GARDEN",
  category: "FANTASY",
  image_url: "https://example.supabase.co/storage/v1/object/public/cover.webp",
};

describe("libraryTiles", () => {
  it("links local catalog rows to the store, not invented product pages", () => {
    const tiles = libraryTiles(null);
    expect(tiles).toHaveLength(4);
    expect(tiles.every((tile) => tile.href === "/store")).toBe(true);
    expect(tiles.map((tile) => tile.product.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("links live products to their product page", () => {
    expect(libraryTiles([live])).toEqual([
      { product: live, href: "/store/c0ffee" },
    ]);
  });
});

describe("HomeLibrary", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("renders four mini framed covers from catalog data", async () => {
    fetchMock.mockResolvedValue({ data: null, error: null });
    render(<HomeLibrary />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Next in the Machine Brain library",
      }),
    ).toBeInTheDocument();

    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual([
      "Vacuum Pups",
      "Star Drifter",
      "Night Terror",
      "Realm Walker",
    ]);

    const frames = screen.getAllByTestId("cover-frame");
    expect(frames).toHaveLength(4);
    for (const frame of frames) {
      expect(frame).toHaveAttribute("data-frame-src", COVER_FRAME.closedSrc);
    }
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(4));
  });

  it("shows live titles in sentence case with their own art", async () => {
    fetchMock.mockResolvedValue({ data: [live], error: null });
    render(<HomeLibrary />);

    const title = await screen.findByRole("heading", {
      level: 3,
      name: "The secret garden",
    });
    const link = title.closest("a")!;
    expect(link).toHaveAttribute("href", "/store/c0ffee");
    expect(
      within(screen.getByTestId("cover-frame-window")).getByRole(
        "presentation",
      ),
    ).toHaveAttribute("src", live.image_url);
    expect(link).toHaveTextContent(/Fantasy · \$/);
  });

  it("keeps the catalog tiles when the live fetch fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<HomeLibrary />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getAllByTestId("cover-frame")).toHaveLength(4);
  });
});
