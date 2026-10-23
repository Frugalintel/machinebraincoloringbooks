import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeHowItWorks } from "@/components/home-how-it-works";
import { HOME_UNLOCK_STEPS } from "@/lib/home";

describe("HomeHowItWorks", () => {
  it("uses the locked three-step unlocks wording", () => {
    render(<HomeHowItWorks />);

    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /from the back of your book/i }),
    ).toBeInTheDocument();

    for (const step of HOME_UNLOCK_STEPS) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
      expect(screen.getByText(step.copy)).toBeInTheDocument();
    }

    expect(screen.queryByText(/unlock rewards/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free shipping/i)).not.toBeInTheDocument();
  });

  it("keeps step icons cream and the eyebrow signal on near-black", () => {
    const { container } = render(<HomeHowItWorks />);
    const eyebrow = screen.getByText("How it works");
    expect(eyebrow.className).toMatch(/font-label/);
    expect(eyebrow.className).toMatch(/text-signal/);
    expect(container.innerHTML).not.toMatch(
      /text-primary|bg-primary|bg-signal/,
    );
    expect(container.querySelectorAll(".font-display")).toHaveLength(0);
  });
});
