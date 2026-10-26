import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/footer";
import { HomeFooter } from "@/components/home-footer";
import { FOOTER_LINK_GROUPS, SITE_SOCIAL_LINKS } from "@/lib/site-shell";

const nav = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe("Footer", () => {
  beforeEach(() => {
    nav.pathname = "/game";
  });

  it("renders grouped links, legal, and the F3 lockup", () => {
    render(<Footer />);

    const home = screen.getByRole("link", { name: "Machine Brain" });
    expect(home).toHaveAttribute("href", "/");
    expect(home.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/mb-mark-full-cream.svg",
    );

    for (const group of FOOTER_LINK_GROUPS) {
      expect(
        screen.getByRole("heading", { name: group.heading }),
      ).toBeInTheDocument();
      for (const link of group.links) {
        expect(
          screen.getAllByRole("link", { name: link.name })[0],
        ).toHaveAttribute("href", link.href);
      }
    }

    expect(screen.getByText(/©/)).toBeInTheDocument();
    expect(SITE_SOCIAL_LINKS).toHaveLength(0);
    expect(
      screen.queryByRole("link", { name: /twitter|instagram|facebook/i }),
    ).not.toBeInTheDocument();
  });

  it("hides on pages that own the HomeFooter plate, plus review and admin", () => {
    for (const path of [
      "/",
      "/auth",
      "/scan",
      "/review",
      "/admin",
      "/stories",
      "/store",
      "/collectibles",
      "/about",
      "/help",
    ]) {
      nav.pathname = path;
      const { container, unmount } = render(<Footer />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it("hides on the routes that own the home plate, including the 404", () => {
    for (const path of [
      "/privacy",
      "/terms",
      "/licenses",
      "/trophy-room",
      "/orders/lookup",
      "/zz-not-a-page",
      "/about",
      "/help",
    ]) {
      nav.pathname = path;
      const { container, unmount } = render(<Footer />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it("keeps the legacy footer on /game without the retired lines", () => {
    nav.pathname = "/about";
    const { container, rerender, unmount } = render(<Footer />);
    expect(container).toBeEmptyDOMElement();

    nav.pathname = "/help";
    rerender(<Footer />);
    expect(container).toBeEmptyDOMElement();

    nav.pathname = "/game";
    rerender(<Footer />);
    expect(container.querySelector("footer.site-footer")).not.toBeNull();
    expect(container.textContent).not.toMatch(/Coloring books with secrets/);
    expect(container.textContent).not.toMatch(/Est\. 2025/);
    unmount();
  });

  it("lists Collectibles under Shop and Trophy Room under Unlocks", () => {
    render(<HomeFooter samples={false} />);

    const shop = screen.getByRole("navigation", { name: "Shop" });
    expect(
      within(shop).getByRole("link", { name: "Collectibles" }),
    ).toHaveAttribute("href", "/collectibles");

    const unlocks = screen.getByRole("navigation", { name: "Unlocks" });
    expect(
      within(unlocks).getByRole("link", { name: "Trophy Room" }),
    ).toHaveAttribute("href", "/trophy-room");

    const help = screen.getByRole("navigation", { name: "Help" });
    expect(within(help).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );

    const account = screen.getByRole("navigation", { name: "Account" });
    expect(
      within(account).getByRole("link", { name: "Sign in" }),
    ).toHaveAttribute("href", "/auth?mode=login");
    expect(
      within(account).getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/auth?mode=register");
    expect(
      within(account).getByRole("link", { name: "Order lookup" }),
    ).toHaveAttribute("href", "/orders/lookup");

    expect(screen.getByRole("link", { name: "Licenses" })).toHaveAttribute(
      "href",
      "/licenses",
    );
    expect(screen.queryByText(/Est\. 2025/)).not.toBeInTheDocument();
  });

  it("does not paint orange fills or an orange Brain wordmark", () => {
    const { container } = render(<Footer />);

    expect(
      container.querySelectorAll(
        '[class*="bg-primary"], [class*="bg-signal"], [class*="bg-brand-orange"]',
      ),
    ).toHaveLength(0);

    const mark = container.querySelector("img");
    expect(mark).toHaveAttribute("src", "/brand/mb-mark-full-cream.svg");
    expect(
      screen.getByRole("link", { name: "Machine Brain" }),
    ).toHaveTextContent("Machine Brain");
  });
});
