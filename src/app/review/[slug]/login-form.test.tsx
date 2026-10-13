import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewLoginForm } from "@/app/review/[slug]/login-form";
import {
  REVIEW_LOGIN_LOCKED_MESSAGE,
  REVIEW_LOGIN_PASSWORD_MESSAGE,
} from "@/lib/review/login-errors";

describe("ReviewLoginForm", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("shows the lockout message when the page is opened with error=locked", () => {
    render(<ReviewLoginForm slug="demo-book" error="locked" />);

    expect(screen.getByText(REVIEW_LOGIN_LOCKED_MESSAGE)).toBeInTheDocument();
    expect(
      screen.queryByText(REVIEW_LOGIN_PASSWORD_MESSAGE),
    ).not.toBeInTheDocument();
  });

  it("keeps the wrong-password message for a 401 response", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<ReviewLoginForm slug="demo-book" error={null} />);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong-password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /unlock/i }));

    await waitFor(() => {
      expect(
        screen.getByText(REVIEW_LOGIN_PASSWORD_MESSAGE),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(REVIEW_LOGIN_LOCKED_MESSAGE),
    ).not.toBeInTheDocument();
  });

  it("shows the lockout message when login returns 429", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Too many failed login attempts." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "900",
          },
        },
      ),
    );

    render(<ReviewLoginForm slug="demo-book" error={null} />);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong-password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /unlock/i }));

    await waitFor(() => {
      expect(screen.getByText(REVIEW_LOGIN_LOCKED_MESSAGE)).toBeInTheDocument();
    });
    expect(
      screen.queryByText(REVIEW_LOGIN_PASSWORD_MESSAGE),
    ).not.toBeInTheDocument();
  });
});
