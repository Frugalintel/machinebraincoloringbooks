import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartDrawer } from "@/components/cart-drawer";

const suggestions = vi.hoisted(() => ({
  rows: [] as Array<{
    id: string;
    title: string;
    price: number;
    subtitle: string;
    image_url?: string;
  }>,
}));

const cart = vi.hoisted(() => ({
  items: [
    {
      id: "1",
      title: "NATURE",
      price: 13,
      quantity: 1,
      subtitle: "Flora",
    },
  ],
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  cartTotal: 13,
  isCartOpen: true,
  setIsCartOpen: vi.fn(),
}));

vi.mock("@/context/cart-context", () => ({
  useCart: () => cart,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        limit: async () => ({ data: suggestions.rows }),
      }),
    }),
  },
}));

describe("CartDrawer tap targets", () => {
  beforeEach(() => {
    suggestions.rows = [];
    cart.items = [
      {
        id: "1",
        title: "NATURE",
        price: 13,
        quantity: 1,
        subtitle: "Flora",
      },
    ];
    cart.cartTotal = 13;
    cart.addItem.mockReset();
    cart.removeItem.mockReset();
    cart.updateQuantity.mockReset();
    cart.isCartOpen = true;
  });

  it("keeps quantity and remove controls at least 44px", () => {
    render(<CartDrawer />);

    const decrease = screen.getByRole("button", {
      name: "Decrease quantity of Flora",
    });
    const increase = screen.getByRole("button", {
      name: "Increase quantity of Flora",
    });
    const remove = screen.getByRole("button", { name: "Remove Flora" });
    const close = screen.getByRole("button", { name: "Close cart" });

    for (const control of [decrease, increase, remove, close]) {
      expect(control).toHaveClass("h-11", "w-11");
    }
    expect(screen.getByText("1 item")).toBeInTheDocument();
    expect(document.querySelector(".cart-scroll")).toBeTruthy();

    fireEvent.click(increase);
    expect(cart.updateQuantity).toHaveBeenCalledWith("1", 2);
  });

  it("sums units in the drawer sentence", () => {
    cart.items = [
      {
        id: "1",
        title: "NATURE",
        price: 13,
        quantity: 2,
        subtitle: "Flora",
      },
      {
        id: "2",
        title: "HORROR",
        price: 12,
        quantity: 1,
        subtitle: "Night Terror",
      },
    ];
    render(<CartDrawer />);

    expect(screen.getByText("3 items")).toBeInTheDocument();
    expect(screen.queryByText("2 items")).toBeNull();
  });

  it("labels suggestion tiles with the book name", async () => {
    suggestions.rows = [
      {
        id: "2",
        title: "BOTANICAL",
        price: 12,
        subtitle: "Realm Walker",
      },
    ];
    render(<CartDrawer />);

    const heading = await screen.findByRole("heading", {
      name: "Realm Walker",
    });
    expect(screen.queryByRole("heading", { name: "Botanical" })).toBeNull();

    const tile = heading.closest(".group");
    if (!(tile instanceof HTMLElement)) {
      throw new Error("suggestion tile missing");
    }
    fireEvent.click(within(tile).getByRole("button"));
    expect(cart.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Realm Walker",
        subtitle: "Realm Walker",
      }),
    );
  });
});
