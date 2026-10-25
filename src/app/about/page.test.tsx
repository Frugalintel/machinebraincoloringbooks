import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutLayout from "@/app/about/layout";
import AboutPage from "@/app/about/page";
import { SAMPLE_BOOKS } from "@/lib/home";

describe("About (A · Spread)", () => {
  it("renders the locked H1, marks the studio placeholder, and links to codes", () => {
    const { container } = render(<AboutPage />);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Drawn in line.");
    expect(h1).toHaveTextContent("Finished by you.");
    expect(h1).toHaveClass("font-display");
    expect(container.querySelectorAll(".font-display")).toHaveLength(1);

    expect(screen.getByText(/placeholder/i)).toBeVisible();
    expect(screen.getByText(/who makes the books, and where/i)).toBeVisible();

    const codes = screen.getByRole("link", {
      name: /how codes and points work/i,
    });
    expect(codes).toHaveAttribute("href", "/help#codes");
    expect(container.textContent).toMatch(/code is \+1 point/i);
    expect(container.textContent).toMatch(/verified photo is \+1 more/i);
    expect(container.textContent).toMatch(/collectible drawn for your copy/i);

    expect(container.textContent).not.toMatch(/\bwe\b/i);
    expect(container.textContent).not.toMatch(/!/);
  });

  it("reuses the sample books and keeps them labelled as sample", () => {
    const { container } = render(<AboutPage />);

    for (const book of SAMPLE_BOOKS) {
      expect(screen.getByText(book.title)).toBeInTheDocument();
    }
    expect(screen.getByText(/titles, covers and art · sample/i)).toBeVisible();
    expect(container.textContent).not.toMatch(/@sample|Instagram|Pinterest/);
  });

  it("owns the Take your time plate and wraps the glasshouse", () => {
    const { container } = render(
      <AboutLayout>
        <AboutPage />
      </AboutLayout>,
    );

    expect(container.querySelector("footer.ft")).not.toBeNull();
    expect(container.textContent).toMatch(/Take your/);
    expect(container.querySelector("footer.site-footer")).toBeNull();
    expect(container.textContent).not.toMatch(/Coloring books with secrets/);
    expect(container.querySelector(".bimg-wrap")).not.toBeNull();
    expect(container.querySelector(".bimg-wrap .bimg")).not.toBeNull();
  });

  it("serves rasters through next/image with sizes", () => {
    const { container } = render(<AboutPage />);
    const images = [...container.querySelectorAll("img")].filter(
      (img) => !img.getAttribute("src")?.startsWith("/brand/"),
    );
    expect(images.length).toBeGreaterThan(6);
    for (const img of images) {
      expect(img.getAttribute("sizes"), img.getAttribute("src")!).toBeTruthy();
    }
  });
});
