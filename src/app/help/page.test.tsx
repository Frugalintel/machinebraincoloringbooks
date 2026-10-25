import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HelpPage from "@/app/help/page";
import {
  HELP_CHIPS,
  HELP_FAQ,
  HELP_H1,
  HELP_PLACEHOLDERS,
  HELP_SAMPLE_CODE,
  HELP_SAMPLE_NOTE,
  HELP_SIGN_IN_HREF,
} from "@/lib/help";

function renderHelp() {
  return render(<HelpPage />);
}

describe("Help (A · Index)", () => {
  it("renders one Redaction H1", () => {
    const { container } = renderHelp();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(HELP_H1);
    expect(h1).toHaveClass("font-display");
    expect(container.querySelectorAll(".font-display")).toHaveLength(1);
  });

  it("marks every placeholder and keeps the sample code labelled", () => {
    const { container } = renderHelp();
    const text = container.textContent ?? "";
    for (const placeholder of HELP_PLACEHOLDERS) {
      expect(text).toContain(placeholder);
    }
    expect(
      container.querySelectorAll(".help-ph-in, .help-ph").length,
    ).toBeGreaterThanOrEqual(HELP_PLACEHOLDERS.length);
    expect(text).toContain(HELP_SAMPLE_CODE);
    expect(text).toContain(HELP_SAMPLE_NOTE);
    expect(text).not.toContain("support@machinebrain.com");
  });

  it("speaks to you and never says we", () => {
    const { container } = renderHelp();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\bwe\b/i);
    expect(text).not.toContain("!");
    expect(text).not.toMatch(/\breward|\bwin\b/i);
  });

  it("keeps a stable #codes anchor for /about", () => {
    renderHelp();
    const codes = document.getElementById("codes");
    expect(codes).not.toBeNull();
    expect(codes).toHaveAttribute("id", "codes");
    expect(
      within(codes as HTMLElement).getByRole("heading", { level: 2 }),
    ).toHaveTextContent("Page codes");
    for (const group of HELP_FAQ) {
      expect(document.getElementById(group.id)).not.toBeNull();
    }
    expect(document.getElementById("contact")).not.toBeNull();
  });

  it("filters the FAQ with aria-pressed chips", () => {
    renderHelp();
    const chips = screen.getByRole("group", {
      name: "Filter questions by topic",
    });
    const all = within(chips).getByRole("button", { name: "All" });
    const codes = within(chips).getByRole("button", { name: "Codes" });

    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(document.getElementById("books")).toBeVisible();
    expect(document.getElementById("codes")).toBeVisible();

    fireEvent.click(codes);
    expect(codes).toHaveAttribute("aria-pressed", "true");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(document.getElementById("books")).not.toBeVisible();
    expect(document.getElementById("codes")).toBeVisible();
    expect(document.getElementById("codes")).not.toHaveAttribute("hidden");

    fireEvent.click(all);
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(document.getElementById("books")).toBeVisible();
    expect(HELP_CHIPS.map((chip) => chip.label)).toEqual(
      within(chips)
        .getAllByRole("button")
        .map((button) => button.textContent),
    );
  });

  it("sends Sign in back to /help and sizes the step art", () => {
    const { container } = renderHelp();
    const signIn = screen.getAllByRole("link", { name: "Sign in" });
    expect(
      signIn.some((link) => link.getAttribute("href") === HELP_SIGN_IN_HREF),
    ).toBe(true);
    const images = [...container.querySelectorAll("img")];
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(
        img.getAttribute("alt"),
        img.getAttribute("src") ?? "",
      ).toBeTruthy();
      expect(
        img.getAttribute("sizes"),
        img.getAttribute("src") ?? "",
      ).toBeTruthy();
    }
  });
});
