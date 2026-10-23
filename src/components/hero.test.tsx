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
      screen.getByText(/look closer\. hidden parts wait in the lines/i),
    ).toBeInTheDocument();

    const browse = screen.getByRole("link", { name: /browse books/i });
    expect(browse).toHaveAttribute("href", "/store");

    const how = screen.getByRole("link", { name: /how it works/i });
    expect(how).toHaveAttribute("href", "#how-it-works");
    expect(how.tagName).toBe("A");

    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-labelledby",
      "home-hero-heading",
    );
  });

  it("does not render hype chips", () => {
    render(<Hero />);

    expect(screen.queryByText("100+ pages")).not.toBeInTheDocument();
    expect(screen.queryByText("Free shipping")).not.toBeInTheDocument();
    expect(screen.queryByText("Unlock Rewards")).not.toBeInTheDocument();
  });

  it("uses the local portrait fallback and catalog holiday badge when image_url is missing", () => {
    render(<Hero />);

    const cover = screen.getByRole("img", { name: /cover|art/i });
    expect(cover).toHaveAttribute("src", HERO_FALLBACK_COVER);
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("Holiday");
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("$15.00");
    expect(screen.getByTestId("hero-price-badge")).not.toHaveTextContent(
      "HOLIDAYHOLIDAY",
    );
  });

  it("prefers featuredProduct.image_url when the catalog returns a cover", async () => {
    mockSingle.mockResolvedValue({ data: featuredProduct, error: null });

    render(<Hero />);

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: /neon circuit/i }),
      ).toHaveAttribute("src", featuredProduct.image_url);
    });

    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("Sci-fi");
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("$24.00");
    expect(screen.getByTestId("hero-price-badge")).not.toHaveTextContent(
      "Neon Circuit",
    );
    expect(
      screen.getByRole("link", { name: /neon circuit art/i }),
    ).toHaveAttribute("href", "/store/book-42");
  });

  it("accepts CMS overrides on the Hero wrapper", () => {
    render(<Hero headlineWhite="Ink" headlineAccent="the relay" />);

    expect(
      screen.getByRole("heading", { name: /ink\s+the relay/i }),
    ).toBeInTheDocument();
  });
});
