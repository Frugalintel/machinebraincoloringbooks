import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("uses Plex Mono at 11px minimum with tracked uppercase", () => {
    render(<Badge>Holiday</Badge>);
    const badge = screen.getByText("Holiday");
    expect(badge.className).toMatch(/font-label/);
    expect(badge.className).not.toMatch(/text-\[(?:8|9|10)px\]/);
    expect(badge.className).not.toMatch(/bg-primary|bg-signal/);
  });
});
