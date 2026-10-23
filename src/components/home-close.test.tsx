import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeClose } from "@/components/home-close";

describe("HomeClose", () => {
  it("closes on a cream surface with ink type and no orange", () => {
    const { container } = render(<HomeClose />);
    const region = screen.getByRole("region");
    expect(region.className).toMatch(/bg-cream/);
    expect(
      screen.getByRole("heading", { name: /a book, or a code/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse books/i })).toHaveAttribute(
      "href",
      "/store",
    );
    expect(screen.getByRole("link", { name: /scan a code/i })).toHaveAttribute(
      "href",
      "/scan",
    );
    expect(container.innerHTML).not.toMatch(/text-signal|bg-primary|bg-signal/);
    expect(container.querySelectorAll(".font-display")).toHaveLength(0);
  });
});
