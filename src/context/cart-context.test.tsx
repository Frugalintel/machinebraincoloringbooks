import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/context/cart-context";
import { STORAGE_KEYS, getUserStorageKey } from "@/lib/constants";

const auth = vi.hoisted(() => ({
  user: null as null | { id: string },
  isLoading: false,
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => auth,
}));

function CartProbe() {
  const { cartCount, addItem } = useCart();
  return (
    <>
      <span data-testid="cart-count">{cartCount}</span>
      <button
        type="button"
        onClick={() => addItem({ id: "book-1", title: "Flora", price: 12 })}
      >
        Add Flora
      </button>
    </>
  );
}

describe("cart sign-out", () => {
  beforeEach(() => {
    localStorage.clear();
    auth.user = { id: "user-1" };
    auth.isLoading = false;
  });

  it("clears the badge and the guest cart when the account signs out", async () => {
    const view = render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    const accountKey = getUserStorageKey(STORAGE_KEYS.CART, "user-1");
    await waitFor(() => {
      expect(localStorage.getItem(accountKey)).toBe("[]");
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Flora" }));
    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("1");
    });

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(accountKey) ?? "[]") as {
        id: string;
      }[];
      expect(saved.map((item) => item.id)).toEqual(["book-1"]);
    });

    auth.user = null;
    view.rerender(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("0");
    });
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) ?? "null"),
    ).toEqual([]);
    expect(
      JSON.parse(localStorage.getItem(accountKey) ?? "[]") as { id: string }[],
    ).toEqual([expect.objectContaining({ id: "book-1", quantity: 1 })]);
  });
});
