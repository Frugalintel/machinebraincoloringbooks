import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandLockup, Mark } from "@/components/mark";

describe("Mark", () => {
  it("renders the full mark at 48 px with the Machine Brain accessible name", () => {
    render(<Mark size={48} ink="cream" />);

    const img = screen.getByRole("img", { name: "Machine Brain" });
    expect(img).toHaveAttribute("src", "/brand/mb-mark-full-cream.svg");
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "48");
    expect(img).toHaveStyle({ width: "48px", height: "48px" });
  });

  it("renders the ink file on light surfaces", () => {
    render(<Mark size={64} ink="ink" />);

    expect(screen.getByRole("img", { name: "Machine Brain" })).toHaveAttribute(
      "src",
      "/brand/mb-mark-full-ink.svg",
    );
  });

  it("renders nothing below 48 px (small-cut seam / wordmark fallback)", () => {
    const { container } = render(<Mark size={32} ink="cream" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("omits alt text when decorative inside a labeled lockup", () => {
    render(<Mark size={48} decorative />);
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "/brand/mb-mark-full-cream.svg",
    );
  });
});

describe("BrandLockup", () => {
  it("keeps the home link and Machine Brain accessible name", () => {
    render(<BrandLockup layout="horizontal" markSize={48} />);

    const link = screen.getByRole("link", { name: "Machine Brain" });
    expect(link).toHaveAttribute("href", "/");
    expect(link.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/mb-mark-full-cream.svg",
    );
    expect(link).toHaveTextContent("Machine Brain");
  });

  it("falls back to the wordmark only when the mark would be below 48 px", () => {
    render(<BrandLockup layout="horizontal" markSize={24} />);

    const link = screen.getByRole("link", { name: "Machine Brain" });
    expect(link).toHaveAttribute("href", "/");
    expect(link.querySelector("img")).toBeNull();
    expect(link).toHaveTextContent("Machine Brain");
  });

  it("uses a stacked heading lockup for auth", () => {
    render(<BrandLockup layout="stacked" markSize={80} headingLevel="h1" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Machine Brain" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Machine Brain" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Machine Brain" }).querySelector("img"),
    ).toHaveAttribute("src", "/brand/mb-mark-full-cream.svg");
  });
});
