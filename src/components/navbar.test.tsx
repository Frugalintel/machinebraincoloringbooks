import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/navbar";
import { SITE_NAV_LINKS } from "@/lib/site-shell";

const nav = vi.hoisted(() => ({
  pathname: "/",
  cartCount: 2,
  setIsCartOpen: vi.fn(),
  openAuthModal: vi.fn(),
  signOut: vi.fn(),
  user: null as null | {
    email: string;
    id: string;
    initials: string;
    displayName?: string;
  },
  isAdmin: false,
  isLoading: false,
}));

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

vi.mock("@/context/cart-context", () => ({
  useCart: () => ({
    setIsCartOpen: nav.setIsCartOpen,
    cartCount: nav.cartCount,
  }),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: nav.user,
    signOut: nav.signOut,
    openAuthModal: nav.openAuthModal,
    isAdmin: nav.isAdmin,
    isLoading: nav.isLoading,
  }),
}));

vi.mock("@/context/settings-context", () => ({
  useSettings: () => ({
    campaign: {
      isActive: false,
      banner: { enabled: false },
      theme: { animation: "none" },
    },
  }),
}));

function menuButton() {
  return screen.getByRole("button", { name: /menu/i });
}

describe("Navbar", () => {
  beforeEach(() => {
    nav.pathname = "/help";
    nav.cartCount = 2;
    nav.user = null;
    nav.isAdmin = false;
    nav.isLoading = false;
    nav.setIsCartOpen.mockReset();
    nav.openAuthModal.mockReset();
    nav.signOut.mockReset();
    document.body.style.overflow = "";
  });

  it("renders the F3 lockup and existing customer routes", () => {
    render(<Navbar />);

    const home = screen.getAllByRole("link", { name: "Machine Brain" })[0];
    expect(home).toHaveAttribute("href", "/");
    expect(home.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringMatching(/mb-mark-(full|S3-small)-cream\.svg$/),
    );

    for (const link of SITE_NAV_LINKS) {
      expect(
        screen.getAllByRole("link", { name: link.name })[0],
      ).toHaveAttribute("href", link.href);
    }

    expect(screen.getByRole("link", { name: /scan/i })).toHaveAttribute(
      "href",
      "/scan",
    );
  });

  it("uses the stacked lockup: S3 at 32 px below lg, full mark at 48 px", () => {
    render(<Navbar />);

    const lockups = screen.getAllByRole("link", { name: "Machine Brain" });
    const marks = lockups.map((link) => link.querySelector("img")!);
    expect(marks.map((img) => img.getAttribute("src"))).toEqual([
      "/brand/mb-mark-S3-small-cream.svg",
      "/brand/mb-mark-full-cream.svg",
    ]);
    expect(marks.map((img) => img.getAttribute("width"))).toEqual(["32", "48"]);
    for (const link of lockups) {
      expect(link.querySelector("span")).toHaveClass("flex-col");
      expect(within(link).getByText("Machine Brain")).toHaveClass("font-mono");
    }
  });

  it("opens and closes the mobile menu with aria-expanded and aria-controls", () => {
    render(<Navbar />);

    const trigger = menuButton();
    const menuId = trigger.getAttribute("aria-controls");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(menuId).toBeTruthy();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: /menu/i });
    expect(dialog).toHaveAttribute("id", menuId);

    fireEvent.click(screen.getByRole("button", { name: /close menu/i }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("dialog", { name: /menu/i }),
    ).not.toBeInTheDocument();
  });

  it("closes the mobile menu on Escape and restores trigger focus", () => {
    render(<Navbar />);

    const trigger = menuButton();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: /menu/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("dialog", { name: /menu/i }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger);
  });

  it("locks body scroll while the mobile menu is open", () => {
    render(<Navbar />);

    fireEvent.click(menuButton());
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("keeps mobile menu links keyboard-reachable", () => {
    render(<Navbar />);
    fireEvent.click(menuButton());

    const dialog = screen.getByRole("dialog", { name: /menu/i });
    const store = within(dialog).getByRole("link", { name: "Store" });
    expect(store).toHaveAttribute("href", "/store");
    expect(store.tabIndex).toBeGreaterThanOrEqual(0);
  });

  it("opens the cart from the header action", () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole("button", { name: /cart/i }));
    expect(nav.setIsCartOpen).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: /cart/i })).toHaveTextContent(
      "2",
    );
  });

  it("uses a minimal lockup header on review", () => {
    for (const path of ["/review", "/review/demo"]) {
      nav.pathname = path;
      const { unmount } = render(<Navbar />);

      expect(
        screen.getAllByRole("link", { name: "Machine Brain" })[0],
      ).toHaveAttribute("href", "/");
      expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
        "href",
        "/",
      );
      expect(
        screen.queryByRole("button", { name: /menu/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /cart/i }),
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("overlays the home hero with Books, Worlds, Stories, About and a Menu", () => {
    nav.pathname = "/";
    nav.cartCount = 0;
    const { container } = render(<Navbar />);

    const header = container.querySelector("header");
    expect(header).toHaveAttribute("data-site-chrome", "overlay");
    const primary = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(primary)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Machine Brain", "/"],
      ["Books", "/store"],
      ["Worlds", "/store"],
      ["Stories", "/stories"],
      ["About", "/about"],
      ["Sign in", "/auth?mode=login&next=%2F"],
    ]);
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /cart/i })).toBeNull();

    const menu = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(
      within(screen.getByRole("dialog", { name: /menu/i })).getByRole("link", {
        name: "Stories",
      }),
    ).toHaveAttribute("href", "/stories");
  });

  it("overlays the sign-in plate with Studio S3's Books, Stories, About", () => {
    nav.pathname = "/auth";
    nav.cartCount = 0;
    const { container } = render(<Navbar />);

    expect(container.querySelector("header")).toHaveAttribute(
      "data-site-chrome",
      "overlay",
    );
    const primary = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(primary)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Machine Brain", "/"],
      ["Books", "/store"],
      ["Stories", "/stories"],
      ["About", "/about"],
      ["Sign in", "/auth?mode=login"],
    ]);
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });

  it("keeps the cart reachable from the home overlay once it has items", () => {
    nav.pathname = "/";
    nav.cartCount = 2;
    render(<Navbar />);
    const cart = screen.getByRole("button", { name: "Cart, 2 items" });
    expect(cart).toHaveTextContent("Cart2");
    expect(cart).toHaveClass("min-h-11");
    expect(cart).not.toHaveClass("bg-cream", "h-11");
    expect(cart.querySelector("span")).toHaveClass(
      "h-8",
      "bg-cream",
      "text-ink",
    );
    fireEvent.click(cart);
    expect(nav.setIsCartOpen).toHaveBeenCalledWith(true);
  });

  it("says one item in the singular and fills the store's cart cream once it has items", () => {
    nav.pathname = "/store";
    nav.cartCount = 1;
    render(<Navbar />);
    const cart = screen.getByRole("button", { name: "Cart, 1 item" });
    expect(cart).toHaveAttribute("data-filled");
    expect(cart).toHaveClass("min-h-11");
    expect(cart).not.toHaveClass("bg-cream");
    expect(cart.querySelector("span")).toHaveClass("h-8", "bg-cream");
  });

  it("gives the store Home's nav on a solid bar, with cart and sign in always reachable", () => {
    for (const path of ["/store", "/store/abc"]) {
      nav.pathname = path;
      nav.cartCount = 0;
      const { container, unmount } = render(<Navbar />);

      expect(container.querySelector("header")).toHaveAttribute(
        "data-site-chrome",
        "solid",
      );
      const primary = screen.getByRole("navigation", { name: "Primary" });
      expect(
        within(primary)
          .getAllByRole("link")
          .map((link) => [link.textContent, link.getAttribute("href")]),
      ).toEqual([
        ["Machine Brain", "/"],
        ["Books", "/store"],
        ["Worlds", "/store#worlds"],
        ["About", "/about"],
        ["Sign in", `/auth?mode=login&next=${encodeURIComponent(path)}`],
      ]);
      expect(
        within(primary).getByRole("link", { name: "Books" }),
      ).toHaveAttribute("aria-current", "page");

      const cart = screen.getByRole("button", { name: "Cart, 0 items" });
      expect(cart).not.toHaveAttribute("data-filled");
      expect(cart).not.toHaveClass("bg-cream");
      fireEvent.click(cart);
      expect(nav.setIsCartOpen).toHaveBeenCalledWith(true);
      expect(
        within(primary).getByRole("link", { name: "Sign in" }),
      ).toHaveAttribute(
        "href",
        `/auth?mode=login&next=${encodeURIComponent(path)}`,
      );
      unmount();
    }
  });

  it("gives stories the store nav plus Stories, Cart, and Sign in", () => {
    nav.pathname = "/stories/lantern";
    nav.cartCount = 0;
    const { container } = render(<Navbar />);

    expect(container.querySelector("header")).toHaveAttribute(
      "data-site-chrome",
      "solid",
    );
    const primary = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(primary)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Machine Brain", "/"],
      ["Books", "/store"],
      ["Worlds", "/store#worlds"],
      ["Stories", "/stories"],
      ["About", "/about"],
      ["Sign in", "/auth?mode=login&next=%2Fstories%2Flantern"],
    ]);
    expect(
      within(primary).getByRole("link", { name: "Stories" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth?mode=login&next=%2Fstories%2Flantern",
    );
    expect(
      screen.getByRole("button", { name: "Cart, 0 items" }),
    ).toBeInTheDocument();
  });

  it("shows the signed-in cue and Sign out on the store instead of Account", () => {
    nav.pathname = "/store";
    nav.user = { email: "you@example.com", id: "u1", initials: "YO" };
    render(<Navbar />);
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Account, YO" }));
    expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveAttribute(
      "href",
      "/profile/me",
    );
    expect(screen.getByRole("menuitem", { name: "Orders" })).toHaveAttribute(
      "href",
      "/profile/me#orders",
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(nav.signOut).toHaveBeenCalled();
  });

  it("shows Sign in on the home header and inside the mobile menu", () => {
    nav.pathname = "/";
    render(<Navbar />);

    const header = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(header).getByRole("link", { name: "Sign in" }),
    ).toHaveAttribute("href", "/auth?mode=login&next=%2F");

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const dialog = screen.getByRole("dialog", { name: /menu/i });
    expect(
      within(dialog).getByRole("link", { name: "Sign in" }),
    ).toHaveAttribute("href", "/auth?mode=login&next=%2F");
  });

  it("moves account-menu focus with arrow keys and restores it on Escape", () => {
    nav.pathname = "/store";
    nav.user = {
      email: "Ada@example.com",
      id: "u1",
      initials: "AD",
      displayName: "Ada",
    };
    render(<Navbar />);

    const trigger = screen.getByRole("button", { name: "Account, Ada" });
    fireEvent.click(trigger);
    const profile = screen.getByRole("menuitem", { name: "Profile" });
    expect(document.activeElement).toBe(profile);
    expect(screen.getByText("Ada@example.com")).toHaveClass(
      "normal-case",
      "font-sans",
    );
    expect(screen.getByRole("menuitem", { name: "Sign out" })).not.toHaveClass(
      "text-danger",
    );

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Orders" }),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("shows the signed-in name and account menu on the home header", () => {
    nav.pathname = "/";
    nav.user = {
      email: "ada@example.com",
      id: "u1",
      initials: "AD",
      displayName: "Ada",
    };
    render(<Navbar />);

    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Account, Ada" }));
    expect(
      screen.getByRole("menuitem", { name: "Profile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Orders" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Sign out" }),
    ).toBeInTheDocument();
  });

  it("keeps Sign in on the full header and the minimal header", () => {
    nav.pathname = "/help";
    const full = render(<Navbar />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth?mode=login&next=%2Fhelp",
    );
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(
      within(screen.getByRole("dialog", { name: /menu/i })).getByRole("link", {
        name: "Sign in",
      }),
    ).toHaveAttribute("href", "/auth?mode=login&next=%2Fhelp");
    full.unmount();

    nav.pathname = "/review";
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth?mode=login&next=%2Freview",
    );
  });

  it("does not flash Sign in while the session is still loading", () => {
    nav.pathname = "/";
    nav.isLoading = true;
    render(<Navbar />);
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(screen.getByText("Loading account")).toBeInTheDocument();
  });

  it("hides the customer navbar on admin", () => {
    nav.pathname = "/admin";
    const { container } = render(<Navbar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not paint orange fills or an orange mark in the rendered chrome", () => {
    const { container } = render(<Navbar />);
    fireEvent.click(menuButton());

    const orangeFills = container.querySelectorAll(
      '[class*="bg-primary"], [class*="bg-signal"], [class*="bg-brand-orange"]',
    );
    expect(orangeFills).toHaveLength(0);

    const marks = container.querySelectorAll("img");
    expect(marks.length).toBeGreaterThan(0);
    for (const mark of marks) {
      expect(mark.getAttribute("src")).toMatch(
        /mb-mark-(full|S3-small)-(cream|ink)\.svg$/,
      );
    }

    expect(container.textContent).not.toMatch(/Machine\s*$/);
    expect(
      screen.getAllByRole("link", { name: "Machine Brain" })[0],
    ).toHaveTextContent("Machine Brain");
  });
});
