import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroCard } from "@/components/hero-card";
import { DEFAULT_HERO_CARD, type HeroCardProps } from "@/lib/hero-card";

const swapped: HeroCardProps = {
  ...DEFAULT_HERO_CARD,
  brandEyebrow: "Archive Press",
  headlineWhite: "Paint",
  headlineAccent: "The Archive",
  subcopy: "Swap this featured book without touching layout.",
  primaryCta: { label: "Shop Archive", href: "/store?cat=archive" },
  secondaryCta: { label: "Open Lore", href: "/stories?set=archive" },
  featureChips: [
    { label: "80 pages" },
    { label: "Secret gate" },
    { label: "Night drop" },
  ],
  coverImage: "https://cdn.example.com/archive.jpg",
  coverAlt: "Archive hardcover",
  coverHref: "/store/archive-1",
  badgeLabel: "ARCHIVE",
  price: "$9.00",
  accentColor: "#00e5ff",
  collectionLink: {
    label: "View Archive Collection",
    href: "/store?cat=archive",
  },
};

describe("HeroCard", () => {
  it("renders the default featured-book contract", () => {
    render(<HeroCard {...DEFAULT_HERO_CARD} />);

    expect(
      screen.getByRole("heading", { name: /color\s+the machine/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sci-fi coloring books with hidden stories inside/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse books/i })).toHaveAttribute(
      "href",
      "/store",
    );
    expect(screen.getByRole("link", { name: /read stories/i })).toHaveAttribute(
      "href",
      "/stories",
    );
    expect(screen.getByText("100+ pages")).toBeInTheDocument();
    expect(screen.getByText("Hidden code")).toBeInTheDocument();
    expect(screen.getByText("Free shipping")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      DEFAULT_HERO_CARD.coverImage,
    );
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("HOLIDAY");
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("$15.00");
    expect(
      screen.getByRole("link", { name: /view sci-fi collection/i }),
    ).toHaveAttribute("href", "#store-section");
  });

  it("swaps copy, cover, chips, and price from props without a second layout", () => {
    const { rerender } = render(<HeroCard {...DEFAULT_HERO_CARD} />);
    const defaultLayout = screen.getByTestId("hero-layout").className;

    rerender(<HeroCard {...swapped} />);

    expect(screen.getByTestId("hero-layout").className).toBe(defaultLayout);
    expect(
      screen.getByRole("heading", { name: /paint\s+the archive/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Archive Press")).toBeInTheDocument();
    expect(
      screen.getByText(/swap this featured book without touching layout/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop archive/i })).toHaveAttribute(
      "href",
      "/store?cat=archive",
    );
    expect(screen.getByRole("link", { name: /open lore/i })).toHaveAttribute(
      "href",
      "/stories?set=archive",
    );
    expect(screen.getByText("80 pages")).toBeInTheDocument();
    expect(screen.getByText("Secret gate")).toBeInTheDocument();
    expect(screen.getByText("Night drop")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://cdn.example.com/archive.jpg",
    );
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("ARCHIVE");
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("$9.00");
    expect(screen.getByTestId("hero-price-badge")).not.toHaveTextContent(
      "ARCHIVEARCHIVE",
    );
  });

  it("stacks copy above the book and keeps the cover in flow, not behind a HUD", () => {
    render(<HeroCard {...DEFAULT_HERO_CARD} />);

    const layout = screen.getByTestId("hero-layout");
    const copy = screen.getByTestId("hero-copy");
    const cover = screen.getByTestId("hero-cover-stage");

    expect(layout.className).toMatch(/flex-col/);
    expect(layout.className).toMatch(/lg:flex-row/);
    expect(copy.className).not.toMatch(/backdrop-blur/);
    expect(cover.className).not.toMatch(/absolute inset-0/);
    expect(
      copy.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("applies the accent color as a CSS custom property", () => {
    render(<HeroCard {...swapped} />);

    expect(screen.getByRole("region")).toHaveStyle({
      "--hero-accent": "#00e5ff",
    });
  });
});
