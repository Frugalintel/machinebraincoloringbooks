import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthPage from "@/app/auth/page";
import { supabase } from "@/lib/supabase";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, refresh: nav.refresh }),
  usePathname: () => "/auth",
}));

vi.mock("@/context/auth-context", () => {
  const useAuth = () => ({
    user: null,
    signOut: vi.fn(),
  });
  return { useAuth, useOptionalAuth: useAuth };
});

const signIn = vi.mocked(supabase.auth.signInWithPassword);
const signUp = vi.mocked(supabase.auth.signUp);

async function renderAuth(query = "") {
  const searchParams = Object.fromEntries(new URLSearchParams(query));
  return render(
    await AuthPage({ searchParams: Promise.resolve(searchParams) }),
  );
}

function form() {
  return screen.getByRole("form", { name: "Account" });
}

function submit() {
  fireEvent.submit(form());
}

function fill(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function heading() {
  return screen.getByRole("heading", { level: 1 });
}

function summary() {
  return screen.getByTestId("auth-summary");
}

const signedIn = {
  data: { user: {}, session: {} },
  error: null,
} as unknown as Awaited<ReturnType<typeof signIn>>;

beforeEach(() => {
  nav.push.mockReset();
  nav.refresh.mockReset();
  signIn.mockReset();
  signUp.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("/auth S3 rendering", () => {
  it("sets the one Redaction H1 as the giant per-state line", async () => {
    const { container } = await renderAuth();

    expect(heading()).toHaveTextContent("Sign in. Welcome back.");
    expect(heading()).toHaveClass("font-display", "sa-h1");
    expect(container.querySelectorAll(".font-display")).toHaveLength(1);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector(".sa-lines")).toHaveAttribute(
      "data-fit",
      "in",
    );
    expect(screen.getByText(/keeps the books you register/)).toBeVisible();
  });

  it("sits between the overlay shell and Home's footer plate", async () => {
    const { container } = await renderAuth();
    expect(screen.getByTestId("auth-page")).toHaveClass("home-e2", "sa-page");
    expect(container.querySelector("footer.ft")).not.toBeNull();
    expect(screen.getByText("Take your")).toBeInTheDocument();
  });

  it("labels every input and wires autocomplete for password managers", async () => {
    await renderAuth();

    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.queryByLabelText("Confirm password")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));

    expect(heading()).toHaveTextContent("Create an account. Keep your pages.");
    expect(heading()).toHaveFocus();
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAccessibleDescription("At least 6 characters.");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toHaveAttribute("type", "submit");
  });

  it("opens sign-up from ?mode=register, or ?email alone, and keeps the email", async () => {
    const { unmount } = await renderAuth(
      "mode=register&email=you%40example.com",
    );
    expect(heading()).toHaveTextContent("Keep your pages.");
    expect(screen.getByLabelText("Email")).toHaveValue("you@example.com");
    unmount();

    await renderAuth("email=you%40example.com");
    expect(heading()).toHaveTextContent("Keep your pages.");
  });

  it("does not fake auth options or link a reset flow that does not exist", async () => {
    const { container } = await renderAuth();
    expect(container.querySelector(".sa")?.textContent).not.toMatch(
      /google|apple|facebook|twitter|forgot|reset|provider/i,
    );
    expect(container.textContent).not.toContain("!");
  });
});

describe("/auth errors and loading", () => {
  it("marks every bad field at once, summarises at the top and focuses the first", async () => {
    await renderAuth();
    submit();

    expect(summary()).toHaveTextContent("Check thisCheck the marked fields.");
    expect(summary().closest('[role="alert"]')).not.toBeNull();
    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Check this Enter your email.");
    expect(password).toHaveAccessibleDescription(
      "Check this Enter your password.",
    );
    expect(email).toHaveFocus();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("checks the email shape, the 6-character minimum and the match on sign-up", async () => {
    await renderAuth("mode=register");
    fill("Email", "you@example");
    fill("Password", "abc");
    fill("Confirm password", "abd");
    submit();

    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Check this That doesn’t look like an email address.",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 6 characters. Check this Use at least 6 characters.",
    );
    expect(
      screen.getByLabelText("Confirm password"),
    ).toHaveAccessibleDescription("Check this The two passwords don’t match.");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("puts a lone mismatch on the confirm field and focuses it", async () => {
    await renderAuth("mode=register");
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    fill("Confirm password", "secret2");
    submit();

    const confirm = screen.getByLabelText("Confirm password");
    expect(confirm).toHaveAttribute("aria-invalid", "true");
    expect(confirm).toHaveFocus();
    expect(screen.getByLabelText("Password")).not.toHaveAttribute(
      "aria-invalid",
    );
  });

  it("holds the form while signing in, then explains a wrong password", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof signIn>>) => void;
    signIn.mockReturnValue(new Promise((done) => (resolve = done)));
    await renderAuth();
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    submit();

    const button = within(form()).getByRole("button", { name: "Sign in" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(form()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(within(form()).getByRole("status")).toHaveTextContent("Signing in…");
    submit();
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith({
      email: "you@example.com",
      password: "secret1",
    });

    await act(async () => {
      resolve({
        data: { user: null, session: null },
        error: new Error("Invalid login credentials"),
      } as unknown as Awaited<ReturnType<typeof signIn>>);
    });

    expect(summary()).toHaveTextContent(
      "That email and password don’t match an account.",
    );
    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).not.toHaveAttribute("aria-describedby");
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAccessibleDescription(
      "Check this Check it and try again.",
    );
    expect(password).toHaveFocus();
    expect(button).not.toHaveAttribute("aria-disabled");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("moves an existing account to sign in with a summary", async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("User already registered"),
    } as unknown as Awaited<ReturnType<typeof signUp>>);
    await renderAuth("mode=register");
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    fill("Confirm password", "secret1");
    submit();

    await waitFor(() =>
      expect(summary()).toHaveTextContent("You already have an account"),
    );
    expect(heading()).toHaveTextContent("Welcome back.");
  });

  it("shows the Check your email state after a sign-up that needs confirming", async () => {
    signUp.mockResolvedValue({
      data: { user: { email: "you@example.com" }, session: null },
      error: null,
    } as unknown as Awaited<ReturnType<typeof signUp>>);
    await renderAuth("mode=register");
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    fill("Confirm password", "secret1");
    submit();

    const check = await screen.findByTestId("auth-check");
    expect(check).toHaveAttribute("role", "status");
    expect(check).toHaveTextContent("Link sent");
    expect(heading()).toHaveTextContent("Check your email.");
    expect(heading()).toHaveFocus();
    expect(screen.queryByRole("form", { name: "Account" })).toBeNull();
    expect(nav.push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(heading()).toHaveTextContent("Welcome back.");
    expect(screen.getByLabelText("Email")).toHaveValue("you@example.com");
  });
});

describe("/auth next= redirect", () => {
  async function signInWith(query: string) {
    signIn.mockResolvedValue(signedIn);
    await renderAuth(query);
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    submit();
    await waitFor(() => expect(nav.push).toHaveBeenCalledTimes(1));
    return nav.push.mock.calls[0][0] as string;
  }

  it("follows an on-site next and defaults to the profile", async () => {
    expect(await signInWith("next=%2Fcollectibles")).toBe("/collectibles");
    expect(nav.refresh).toHaveBeenCalled();
    nav.push.mockReset();
    document.body.innerHTML = "";
    expect(await signInWith("")).toBe("/profile/me");
  });

  it.each([
    "//evil.example",
    "https://evil.example/profile",
    "/\\evil.example",
    "javascript:alert(1)",
  ])("sends an off-site next (%s) to the profile instead", async (next) => {
    expect(await signInWith(`next=${encodeURIComponent(next)}`)).toBe(
      "/profile/me",
    );
  });
});

describe("/auth code arrival from /scan", () => {
  const query = `next=${encodeURIComponent("/scan?mode=code&code=ab12")}`;

  it("holds the code, upper case, on the sign-in side", async () => {
    const { container } = await renderAuth(query);
    expect(heading()).toHaveTextContent("Sign in. Keep your code.");
    expect(container.querySelector(".sa-lines")).toHaveAttribute(
      "data-fit",
      "code",
    );
    const held = screen.getByTestId("auth-held");
    expect(screen.getByTestId("auth-code")).toHaveTextContent(/^AB12$/);
    expect(held).toHaveTextContent("Code held");
    expect(held).toHaveTextContent("Sign in to keep it.");
    expect(screen.queryByText(/keeps the books you register/)).toBeNull();
  });

  it("says create an account on the sign-up side", async () => {
    await renderAuth(`${query}&mode=register`);
    expect(heading()).toHaveTextContent("Create an account. Keep your code.");
    expect(screen.getByTestId("auth-held")).toHaveTextContent(
      "Create an account to keep it.",
    );
  });

  it("goes back to /scan with the code after signing in, so /scan prefills it", async () => {
    signIn.mockResolvedValue(signedIn);
    await renderAuth(query);
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    submit();
    await waitFor(() =>
      expect(nav.push).toHaveBeenCalledWith("/scan?mode=code&code=ab12"),
    );
  });
});

describe("/auth brand guards", () => {
  it("keeps orange to small mono labels and never fills with it", async () => {
    const { container } = await renderAuth(
      "mode=register&next=%2Fscan%3Fmode%3Dcode%26code%3Dab12",
    );
    submit();

    expect(
      container.querySelectorAll(
        '[class*="bg-primary"], [class*="bg-signal"], [class*="brand-orange"], [class*="bg-[#"]',
      ),
    ).toHaveLength(0);
    for (const node of container.querySelectorAll(".sa-signal")) {
      expect(node.closest(".sa-mono")).not.toBeNull();
    }
    for (const node of container.querySelectorAll("[class]")) {
      expect(node.className.toString()).not.toMatch(
        /danger|warning|success|red-|amber/,
      );
    }
  });

  it("uses the square cream submit button", async () => {
    await renderAuth();
    expect(within(form()).getByRole("button", { name: "Sign in" })).toHaveClass(
      "sa-btn",
    );
  });
});
