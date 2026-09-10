import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Hero } from "@/components/hero";

vi.mock("@/context/settings-context", () => ({
  useSettings: () => ({
    campaign: {
      isActive: false,
      featuredProductId: undefined,
      theme: undefined,
    },
  }),
}));

vi.mock("@/lib/supabase", () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    limit: () => chain,
    single: async () => ({ data: null, error: null }),
  };

  return {
    supabase: {
      from: () => chain,
    },
  };
});

describe("Hero", () => {
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
  });

  it("keeps trust stats visible in the copy column", () => {
    render(<Hero />);

    expect(screen.getByText("100+ pages")).toBeInTheDocument();
    expect(screen.getByText("Hidden code")).toBeInTheDocument();
    expect(screen.getByText("Free shipping")).toBeInTheDocument();
  });
});
