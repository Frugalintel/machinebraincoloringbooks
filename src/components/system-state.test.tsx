import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SystemState } from "@/components/system-state";

describe("SystemState", () => {
  it("renders the branded 404 with mark, title, and next actions", () => {
    render(<SystemState kind="notFound" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toHaveClass("font-display");
    expect(screen.getByText("Error 404")).toHaveClass("font-label");
    expect(screen.getByText("Error 404")).toHaveClass("text-signal");
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "/brand/mb-mark-full-cream.svg",
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Store" })).toHaveAttribute(
      "href",
      "/store",
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth?mode=login",
    );
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("renders the error state with retry", () => {
    const reset = vi.fn();
    render(<SystemState kind="error" reset={reset} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Something went wrong" }),
    ).toBeInTheDocument();
    screen.getByRole("button", { name: "Try again" }).click();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("uses the lockup when the root layout is missing", () => {
    render(<SystemState kind="error" standalone reset={() => undefined} />);

    expect(screen.getByRole("link", { name: "Machine Brain" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
