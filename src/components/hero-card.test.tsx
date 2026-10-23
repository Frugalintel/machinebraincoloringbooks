import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroCard } from "@/components/hero-card";
import { FRAME_PORTRAIT_SRC, HERO_FALLBACK_COVER } from "@/lib/home";
import { DEFAULT_HERO_CARD, type HeroCardProps } from "@/lib/hero-card";

const swapped: HeroCardProps = {
  ...DEFAULT_HERO_CARD,
  brandEyebrow: "Archive press",
  headlineWhite: "Paint",
  headlineAccent: "the archive",
  subcopy: "Swap this featured book without touching layout.",
  primaryCta: { label: "Shop archive", href: "/store?cat=archive" },
  secondaryCta: { label: "How it works", href: "#how-it-works" },
  coverImage: "https://cdn.example.com/archive.jpg",
  coverAlt: "Archive art",
  coverHref: "/store/archive-1",
  badgeLabel: "ARCHIVE",
  price: "$9.00",
};

describe("HeroCard", () => {
  it("renders the default featured-book contract", () => {
    render(<HeroCard {...DEFAULT_HERO_CARD} />);

    expect(
      screen.getByRole("heading", { name: /color\s+the machine/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/look closer\. hidden parts wait in the lines/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse books/i })).toHaveAttribute(
      "href",
      "/store",
    );
    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
    expect(screen.queryByText("Free shipping")).not.toBeInTheDocument();
    expect(screen.queryByText("100+ pages")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: DEFAULT_HERO_CARD.coverAlt }),
    ).toHaveAttribute("src", HERO_FALLBACK_COVER);
    expect(screen.getByTestId("hero-portrait-frame")).toBeInTheDocument();
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("Holiday");
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("$15.00");
    expect(screen.getByTestId("hero-price-badge").className).toMatch(
      /bg-cream/,
    );
    expect(screen.getByTestId("hero-price-badge").className).not.toMatch(
      /bg-white|bg-paper/,
    );
  });

  it("swaps copy, cover, and price from props without a second layout", () => {
    const { rerender } = render(<HeroCard {...DEFAULT_HERO_CARD} />);
    const defaultLayout = screen.getByTestId("hero-layout").className;

    rerender(<HeroCard {...swapped} />);

    expect(screen.getByTestId("hero-layout").className).toBe(defaultLayout);
    expect(
      screen.getByRole("heading", { name: /paint\s+the archive/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Archive press")).toBeInTheDocument();
    expect(
      screen.getByText(/swap this featured book without touching layout/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop archive/i })).toHaveAttribute(
      "href",
      "/store?cat=archive",
    );
    expect(screen.getByRole("img", { name: "Archive art" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/archive.jpg",
    );
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("Archive");
    expect(screen.getByTestId("hero-price-badge")).toHaveTextContent("$9.00");
    expect(screen.getByTestId("hero-price-badge")).not.toHaveTextContent(
      "ARCHIVEARCHIVE",
    );
  });

  it("stacks copy above the portrait frame and keeps the cover in flow", () => {
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
    expect(screen.getByTestId("hero-portrait-frame").innerHTML).toContain(
      FRAME_PORTRAIT_SRC,
    );
    expect(cover.innerHTML).not.toMatch(/hero-book-3d|scale-x-\[-1\]/);
  });

  it("uses a single Redaction H1 and cream CTAs without orange fills", () => {
    const { container } = render(<HeroCard {...DEFAULT_HERO_CARD} />);
    const displays = container.querySelectorAll(".font-display");
    expect(displays).toHaveLength(1);
    expect(displays[0]?.tagName).toBe("H1");
    expect(container.innerHTML).not.toMatch(
      /bg-primary|bg-signal|bg-\(--hero-accent\)/,
    );
    expect(container.innerHTML).not.toContain("noise.svg");
    expect(container.innerHTML).not.toContain("scanlines");
  });
});
