import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { COVER_FRAME, HERO_ART } from "@/lib/home";
import { SITE_URL } from "@/lib/site-url";

vi.mock("@/lib/products", () => ({
  fetchPublishedProducts: vi.fn(async () => ({ data: null, error: null })),
}));

describe("Home page", () => {
  it("renders one Redaction H1 in the canonical frame's title band", () => {
    const { container } = render(<Home />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Look Closer");
    expect(headings[0]).toHaveClass("font-display", "cover-title");
    expect(container.querySelectorAll(".font-display")).toHaveLength(1);

    const hero = screen.getAllByTestId("cover-frame")[0];
    expect(hero).toHaveAttribute("data-frame-src", COVER_FRAME.fullSrc);
    expect(hero).toContainElement(headings[0]);
  });

  it("clips the preloaded hero art to the stepped window under the frame", () => {
    render(<Home />);
    const hero = screen.getAllByTestId("cover-frame")[0];
    const window = within(hero).getByTestId("cover-frame-window");

    expect(window.style.clipPath).toMatch(/^polygon\(/);
    const art = within(window).getByRole("img");
    expect(art).toHaveAttribute("src", HERO_ART.src);
    expect(art).toHaveAttribute("alt", HERO_ART.alt);
    expect(art).toHaveAttribute("data-preload");
    expect(art.getAttribute("sizes")).toContain("83.5vw");

    const frame = hero.querySelector(`img[src="${COVER_FRAME.fullSrc}"]`);
    expect(frame).not.toBeNull();
    expect(window.compareDocumentPosition(frame!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("keeps orange to the VOL 01 label and off every fill", () => {
    const { container } = render(<Home />);
    const orange = container.querySelectorAll('[class*="text-signal"]');
    expect(orange).toHaveLength(1);
    expect(orange[0]).toHaveTextContent(/^Vol 01$/);
    expect(
      container.querySelectorAll(
        '[class*="bg-signal"], [class*="bg-primary"], [class*="bg-brand-orange"]',
      ),
    ).toHaveLength(0);
  });

  it("links the CTAs to existing routes", () => {
    render(<Home />);
    expect(
      screen.getByRole("link", { name: "Browse the books" }),
    ).toHaveAttribute("href", "/store");
    expect(
      screen.getByRole("link", { name: "How unlocks work" }),
    ).toHaveAttribute("href", "#unlocks");
    expect(document.getElementById("unlocks")).not.toBeNull();
  });

  it("builds the plate as a live table without sample values", () => {
    const { container } = render(<Home />);
    const plate = screen.getByTestId("spec-plate");
    expect(plate.tagName).toBe("TABLE");
    const labels = within(plate)
      .getAllByRole("rowheader")
      .map((cell) => cell.textContent);
    expect(labels).toEqual(["Series", "Spec", "Unlock"]);
    expect(container.textContent).not.toMatch(/sample|MB-GNS|cat no/i);
  });

  it("encodes only the site's own /scan route in the QR", () => {
    render(<Home />);
    const qr = screen.getByTestId("home-qr");
    expect(qr).toHaveAttribute("data-qr-value", `${SITE_URL}/scan`);
    expect(qr).toHaveClass("bg-cream");
    expect(qr.querySelector("path")).toHaveAttribute("fill", "#141414");
    expect(
      screen.getByRole("link", { name: "Open the scanner" }),
    ).toHaveAttribute("href", "/scan");
  });

  it("lists the three unlock steps in order", () => {
    render(<Home />);
    const section = document.getElementById("unlocks")!;
    const steps = within(section)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(steps).toEqual([
      "01Scan the code",
      "02Scan your colored pages to earn points",
      "03Spend points on more unlocks",
    ]);
  });
});
