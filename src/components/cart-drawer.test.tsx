import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartDrawer } from "@/components/cart-drawer";

const cart = vi.hoisted(() => ({
  items: [
    {
      id: "1",
      title: "FLORA",
      price: 13,
      quantity: 1,
      subtitle: "Botanical",
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
        limit: async () => ({ data: [] }),
      }),
    }),
  },
}));

describe("CartDrawer tap targets", () => {
  beforeEach(() => {
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

    fireEvent.click(increase);
    expect(cart.updateQuantity).toHaveBeenCalledWith("1", 2);
  });
});
