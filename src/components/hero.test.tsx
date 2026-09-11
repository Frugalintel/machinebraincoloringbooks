import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hero } from "@/components/hero";
import { HERO_FALLBACK_COVER } from "@/lib/hero-card";
import type { Product } from "@/lib/types";

vi.mock("@/context/settings-context", () => ({
  useSettings: () => ({
    campaign: {
      isActive: false,
      featuredProductId: undefined,
      theme: undefined,
    },
  }),
}));

const { mockSingle } = vi.hoisted(() => ({
  mockSingle: vi.fn(),
}));

vi.mock("@/lib/supabase", () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    limit: () => chain,
    single: () => mockSingle(),
  };

  return {
    supabase: {
      from: () => chain,
    },
  };
});

const featuredProduct: Product = {
  id: "book-42",
  title: "Neon Circuit",
  subtitle: "Vol. 1",
  description: "A test book",
  price: 24,
  discount_percent: 0,
  category: "SCI-FI",
  difficulty: 2,
  age: "all",
  color: "bg-[#e63946]",
  accent: "#FF4F00",
  image_url: "https://cdn.example.com/neon-circuit.jpg",
  is_published: true,
};

describe("Hero", () => {
  beforeEach(() => {
    mockSingle.mockReset();
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  it("renders a clear headline, supporting line, and primary store CTA", () => {
    render(<Hero />);

    expect(
      screen.getByRole("heading", { name: /color\s+the machine/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sci-fi coloring books with hidden stories inside/i),
    ).toBeInTheDocument();

    const browse = screen.getByRole("link", { name: /browse books/i });
    expect(browse).toHaveAttribute("href", "/store");

    const stories = screen.getByRole("link", { name: /read stories/i });
    expect(stories).toHaveAttribute("href", "/stories");
    expect(stories.tagName).toBe("A");

    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-labelledby",
      "home-hero-heading",
    );
  });

  it("keeps trust stats visible in the copy column", () => {
    render(<Hero />);

    expect(screen.getByText("100+ pages")).toBeInTheDocument();
    expect(screen.getByText("Hidden code")).toBeInTheDocument();
    expect(screen.getByText("Free shipping")).toBeInTheDocument();
  });

  it("uses the local cover fallback and catalog holiday badge when image_url is missing", () => {
    render(<Hero />);

    const cover = screen.getByRole("img");
    expect(cover).toHaveAttribute("src", HERO_FALLBACK_COVER);
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("HOLIDAY");
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("$15.00");
    expect(screen.getByTestId("hero-price-badge")).not.toHaveTextContent(
      "HOLIDAYHOLIDAY",
    );
  });

  it("prefers featuredProduct.image_url when the catalog returns a cover", async () => {
    mockSingle.mockResolvedValue({ data: featuredProduct, error: null });

    render(<Hero />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        featuredProduct.image_url,
      );
    });

    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("SCI-FI");
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("$24.00");
    expect(screen.getByTestId("hero-price-badge")).not.toHaveTextContent(
      "Neon Circuit",
    );
    expect(
      screen.getByRole("link", { name: /neon circuit cover/i }),
    ).toHaveAttribute("href", "/store/book-42");
  });

  it("accepts CMS overrides on the Hero wrapper", () => {
    render(
      <Hero
        headlineWhite="Ink"
        headlineAccent="The Relay"
        featureChips={[{ label: "Limited drop" }]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /ink\s+the relay/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Limited drop")).toBeInTheDocument();
  });
});
