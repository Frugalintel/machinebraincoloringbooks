import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemState } from "@/components/system-state";

const auth = vi.hoisted(() => ({
  user: null as null | { id: string; email: string; initials: string },
  isLoading: false,
  signOut: async () => undefined,
}));

vi.mock("@/context/auth-context", () => ({
  useOptionalAuth: () => auth,
}));

describe("SystemState", () => {
  beforeEach(() => {
    auth.user = null;
    auth.isLoading = false;
  });

  it("renders the branded 404 with mark, title, and next actions", () => {
    render(<SystemState kind="notFound" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toHaveClass("font-display", "min-w-0", "break-words");
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

  it("sends a signed-in visitor to Account instead of Sign in", () => {
    auth.user = { id: "user-1", email: "ada@example.com", initials: "A" };
    render(<SystemState kind="notFound" />);

    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/profile/me",
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("holds the Sign in slot without a link while auth is loading", () => {
    auth.isLoading = true;
    render(<SystemState kind="notFound" />);

    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(screen.getByText("Sign in")).toHaveClass("invisible");
    expect(screen.getByRole("link", { name: "Store" })).toBeInTheDocument();
  });
});
