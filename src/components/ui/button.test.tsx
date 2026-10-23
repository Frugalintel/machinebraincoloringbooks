import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("exposes primary, secondary, ghost, and destructive variants without orange fills", () => {
    const primary = buttonVariants({ variant: "primary" });
    const secondary = buttonVariants({ variant: "secondary" });
    const ghost = buttonVariants({ variant: "ghost" });
    const destructive = buttonVariants({ variant: "destructive" });

    expect(primary).toMatch(/bg-cream/);
    expect(primary).toMatch(/text-ink/);
    expect(primary).not.toMatch(/bg-primary|bg-signal/);
    expect(secondary).toMatch(/border/);
    expect(ghost).not.toMatch(/bg-primary|bg-signal|bg-accent/);
    expect(destructive).toMatch(/bg-danger-strong|bg-destructive/);
    expect(destructive).not.toMatch(/bg-primary|bg-signal/);
  });

  it("supports sizes, loading, and disabled states", () => {
    const { rerender } = render(
      <Button size="lg" loading>
        Save
      </Button>,
    );
    const loadingButton = screen.getByRole("button", { name: /save/i });
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveAttribute("aria-busy", "true");
    expect(loadingButton.className).toMatch(/h-11|h-12/);

    rerender(
      <Button size="sm" disabled>
        Save
      </Button>,
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("inverts to ink on cream surfaces", () => {
    const onCream = buttonVariants({ variant: "primary", tone: "cream" });
    expect(onCream).toMatch(/bg-ink/);
    expect(onCream).toMatch(/text-cream/);
    expect(onCream).not.toMatch(/bg-primary|bg-signal/);
  });
});
