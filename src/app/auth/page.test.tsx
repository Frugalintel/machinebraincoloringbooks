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
  params: new URLSearchParams(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, refresh: nav.refresh }),
  usePathname: () => "/auth",
  useSearchParams: () => nav.params,
}));

const signIn = vi.mocked(supabase.auth.signInWithPassword);
const signUp = vi.mocked(supabase.auth.signUp);

function renderAuth(query = "") {
  nav.params = new URLSearchParams(query);
  return render(<AuthPage />);
}

function submit() {
  fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
}

/** Status-hue classes that can apply; dormant `aria-invalid:` ones on valid nodes are skipped. */
function liveOffPaletteClasses(root: HTMLElement): string[] {
  const hits: string[] = [];
  for (const node of root.querySelectorAll<HTMLElement>("[class]")) {
    const invalid = node.getAttribute("aria-invalid") === "true";
    for (const token of node.classList) {
      if (!/danger|warning|success|yellow|red-|amber/.test(token)) continue;
      if (token.startsWith("aria-invalid:") && !invalid) continue;
      hits.push(`${node.tagName}:${token}`);
    }
  }
  return hits;
}

function fill(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
  nav.push.mockReset();
  nav.refresh.mockReset();
  signIn.mockReset();
  signUp.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("/auth rendering", () => {
  it("sets one Redaction H1, the mono label and the official lockup", () => {
    const { container } = renderAuth();

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Welcome back");
    expect(h1).toHaveClass("font-display");
    expect(container.querySelectorAll(".font-display")).toHaveLength(1);
    expect(container.querySelectorAll("h1")).toHaveLength(1);

    const label = screen.getByTestId("auth-label");
    expect(label).toHaveTextContent("Sign in");
    expect(label).toHaveClass("font-label", "text-signal");

    const mark = container.querySelector('img[src^="/brand/"]');
    expect(mark).toHaveAttribute("src", "/brand/mb-mark-full-cream.svg");
    expect(container.querySelector('a[aria-label="Machine Brain"]')).toBeNull();
  });

  it("labels every input and wires autocomplete for password managers", () => {
    renderAuth();

    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("name", "email");
    expect(email).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.queryByLabelText("Confirm password")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Create account", pressed: false }),
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Create your account",
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAccessibleDescription("At least 6 characters.");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("opens in create-account mode from ?mode=register and keeps ?email", () => {
    renderAuth("mode=register&email=you%40example.com");

    expect(
      screen.getByRole("button", { name: "Create account", pressed: true }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("you@example.com");
  });

  it("does not fake auth options or link a reset flow that does not exist", () => {
    const { container } = renderAuth();
    expect(container.textContent).not.toMatch(
      /google|apple|facebook|twitter|forgot|provider/i,
    );
    expect(container.textContent).not.toContain("!");
  });

  it("toggles password visibility without losing the value", () => {
    renderAuth();
    fill("Password", "hunter22");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Password")).toHaveValue("hunter22");
  });
});

describe("/auth errors and loading", () => {
  it("ties empty-field errors to each input and focuses the first", () => {
    renderAuth();
    submit();

    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter your email.");
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAccessibleDescription("Enter your password.");
    expect(email).toHaveFocus();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("puts the mismatch error on the confirm field", () => {
    renderAuth("mode=register");
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    fill("Confirm password", "secret2");
    submit();

    const confirm = screen.getByLabelText("Confirm password");
    expect(confirm).toHaveAttribute("aria-invalid", "true");
    expect(confirm).toHaveAccessibleDescription("These passwords don’t match.");
    expect(confirm).toHaveFocus();
    expect(screen.getByLabelText("Password")).not.toHaveAttribute(
      "aria-invalid",
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it("shows a loading state, then a form-level error described on the form", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof signIn>>) => void;
    signIn.mockReturnValue(new Promise((done) => (resolve = done)));
    renderAuth();
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    submit();

    const busy = screen.getByRole("button", { name: /signing in/i });
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(busy).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
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

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Your email or password is incorrect.");
    const form = screen.getByLabelText("Email").closest("form")!;
    expect(form).toHaveAccessibleDescription(
      "Your email or password is incorrect.",
    );
    expect(within(form).getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("keeps the next redirect after a successful sign in", async () => {
    signIn.mockResolvedValue({
      data: { user: {}, session: {} },
      error: null,
    } as unknown as Awaited<ReturnType<typeof signIn>>);
    renderAuth("next=%2Fcollectibles");
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    submit();

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/collectibles"));
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("shows the confirmation notice inline instead of an alert", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    signUp.mockResolvedValue({
      data: { user: { email: "you@example.com" }, session: null },
      error: null,
    } as unknown as Awaited<ReturnType<typeof signUp>>);
    renderAuth("mode=register");
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    fill("Confirm password", "secret1");
    submit();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Check your email for the confirmation link.",
    );
    expect(alertSpy).not.toHaveBeenCalled();
    expect(nav.push).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

describe("/auth brand guards", () => {
  it("never fills with signal orange and keeps orange to the one mono label", () => {
    const { container } = renderAuth("mode=register");
    submit();

    expect(
      container.querySelectorAll(
        '[class*="bg-primary"], [class*="bg-signal"], [class*="brand-orange"], [class*="bg-[#"]',
      ),
    ).toHaveLength(0);
    const orange = container.querySelectorAll('[class*="signal"]');
    expect(orange).toHaveLength(1);
    expect(orange[0]).toHaveClass("font-label");
    expect(liveOffPaletteClasses(container)).toEqual([]);
  });

  it("uses a cream-on-near-black primary button", () => {
    renderAuth();
    const button = screen
      .getByLabelText("Email")
      .closest("form")!
      .querySelector('button[type="submit"]');
    expect(button).toHaveClass("bg-cream", "text-ink");
  });
});
