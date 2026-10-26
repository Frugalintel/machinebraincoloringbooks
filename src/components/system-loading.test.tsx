import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SystemLoading } from "@/components/system-loading";

describe("SystemLoading", () => {
  it("renders a catalog skeleton without a spinner", () => {
    const { container } = render(<SystemLoading variant="catalog" />);

    expect(screen.getByText("Loading")).toHaveClass("font-label");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(container.querySelector("main")).toBeNull();
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector("[class*='glow']")).toBeNull();
    expect(container.innerHTML).not.toMatch(/bg-primary|bg-signal/);
  });

  it("renders detail and account variants from F5 cards", () => {
    const { rerender, container } = render(<SystemLoading variant="detail" />);
    expect(
      container.querySelectorAll("[data-slot='card']").length,
    ).toBeGreaterThan(0);

    rerender(<SystemLoading variant="account" />);
    expect(
      container.querySelectorAll("[data-slot='card']").length,
    ).toBeGreaterThan(0);
    expect(container.querySelector(".animate-spin")).toBeNull();
  });
});
