import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OrderLookupPage from "@/app/orders/lookup/page";

describe("Order lookup", () => {
  it("says tracking is not live, and never invents an order", () => {
    render(<OrderLookupPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Order tracking." }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Order number")).toHaveAttribute(
      "placeholder",
      "Order number",
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "placeholder",
      "Email",
    );
    expect(screen.getByLabelText("Order number").className).toContain(
      "shell-field",
    );

    fireEvent.change(screen.getByLabelText("Order number"), {
      target: { value: "QA-TEST" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));

    expect(screen.getByText(/Tracking isn't live yet/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Orders and shipping" }),
    ).toHaveAttribute("href", "/help#orders");
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/FOUND|Transit|2025/);
    expect(text).not.toContain("!");
  });
});
