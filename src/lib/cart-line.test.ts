import { describe, expect, it } from "vitest";
import {
  cartLineCount,
  cartLineTitle,
  cartUnitCount,
  cartUnitLabel,
} from "@/lib/cart-line";

describe("cart line", () => {
  it("titles a legacy row by the book, not the world", () => {
    expect(cartLineTitle({ title: "HORROR", subtitle: "Night Terror" })).toBe(
      "Night Terror",
    );
    expect(
      cartLineTitle({ title: "Night Terror", subtitle: "Night Terror" }),
    ).toBe("Night Terror");
    expect(cartLineTitle({ title: "Flora" })).toBe("Flora");
  });

  it("counts lines, so a second unit of the same book does not add a line", () => {
    expect(cartLineCount([{ quantity: 2 }, { quantity: 1 }])).toBe(2);
  });

  it("sums units for the drawer sentence and pluralises one item", () => {
    expect(cartUnitCount([{ quantity: 2 }, { quantity: 1 }])).toBe(3);
    expect(cartUnitLabel(3)).toBe("3 items");
    expect(cartUnitLabel(1)).toBe("1 item");
    expect(cartUnitLabel(0)).toBe("0 items");
  });
});
