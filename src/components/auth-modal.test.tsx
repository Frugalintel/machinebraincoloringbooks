import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthModal } from "@/components/auth-modal";

type ModalState = {
  isOpen: boolean;
  view: "login" | "register";
  email?: string;
  code?: string;
  hold?: { kind: "book" | "page-plus" | "code"; label: string };
};

const auth = vi.hoisted(() => ({
  authModal: { isOpen: true, view: "login" } as ModalState,
  closeAuthModal: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: auth.push, refresh: auth.refresh }),
  usePathname: () => "/scan",
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    authModal: auth.authModal,
    closeAuthModal: auth.closeAuthModal,
    signIn: auth.signIn,
    signUp: auth.signUp,
  }),
}));

function openModal(state: Partial<ModalState> = {}) {
  auth.authModal = { isOpen: true, view: "login", ...state };
  return render(<AuthModal />);
}

function submit() {
  fireEvent.submit(screen.getByRole("form", { name: "Account" }));
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
  auth.closeAuthModal.mockReset();
  auth.signIn.mockReset();
  auth.signUp.mockReset();
  auth.refresh.mockReset();
  auth.push.mockReset();
});

describe("AuthModal (S3 plate)", () => {
  it("renders nothing when closed", () => {
    auth.authModal = { isOpen: false, view: "login" };
    const { container } = render(<AuthModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a full-screen labelled dialog with the same giant line as an H2", () => {
    const { container } = openModal();

    const dialog = screen.getByRole("dialog", {
      name: "Sign in. Welcome back.",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveClass("fixed", "inset-0");
    const line = screen.getByRole("heading", { level: 2 });
    expect(line).toHaveClass("font-display", "sa-h1");
    expect(container.querySelector("h1")).toBeNull();
    expect(
      container.querySelector('[data-auth-context="modal"]'),
    ).not.toBeNull();
    expect(container.querySelector('img[src^="/brand/"]')).toHaveAttribute(
      "src",
      "/brand/mb-mark-S3-small-cream.svg",
    );
    expect(container.querySelector('a[href="/"]')).toBeNull();
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(container.textContent).not.toMatch(
      /google|apple|facebook|twitter|forgot|!/i,
    );
  });

  it("opens on the requested view with the passed email", () => {
    openModal({ view: "register", email: "you@example.com" });
    expect(
      screen.getByRole("dialog", {
        name: "Create an account. Keep your pages.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("you@example.com");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("holds a code from /scan in the Keep your code state", () => {
    openModal({ code: "AB12" });
    expect(
      screen.getByRole("dialog", { name: "Sign in. Keep your code." }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("auth-code")).toHaveTextContent("AB12");
    expect(screen.getByTestId("auth-held")).toHaveTextContent(
      "Sign in to keep it.",
    );
  });

  it("starts fresh on each open request", () => {
    const { rerender } = openModal();
    fill("Email", "you@example.com");
    submit();
    expect(screen.getByTestId("auth-summary")).toBeInTheDocument();

    auth.authModal = { isOpen: true, view: "register", code: "CD34" };
    rerender(<AuthModal />);
    expect(screen.queryByTestId("auth-summary")).toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Keep your code.",
    );
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("closes on Escape and the Close button", () => {
    openModal();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(auth.closeAuthModal).toHaveBeenCalledTimes(2);
  });

  it("traps Tab inside the dialog", () => {
    openModal();
    const close = screen.getByRole("button", { name: "Close" });
    const swap = screen.getByRole("button", { name: "Create an account" });
    swap.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(swap).toHaveFocus();
  });

  it("ties inline errors to fields with a summary", () => {
    openModal();
    fill("Email", "you@example.com");
    submit();

    expect(screen.getByTestId("auth-summary")).toHaveTextContent(
      "Check the marked fields.",
    );
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAccessibleDescription(
      "Check this Enter your password.",
    );
    expect(password).toHaveFocus();
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it("shows loading, then maps the server error onto the form", async () => {
    let resolve!: (value: { error: Error | null }) => void;
    auth.signIn.mockReturnValue(new Promise((done) => (resolve = done)));
    openModal();
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    submit();

    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(auth.signIn).toHaveBeenCalledWith("you@example.com", "secret1");

    await act(async () => {
      resolve({ error: new Error("Invalid login credentials") });
    });

    expect(screen.getByTestId("auth-summary")).toHaveTextContent(
      "That email and password don’t match an account.",
    );
    expect(auth.closeAuthModal).not.toHaveBeenCalled();
  });

  it("refreshes and closes in place on success, without redirecting", async () => {
    auth.signIn.mockResolvedValue({ error: null });
    openModal({ code: "AB12" });
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    submit();

    await waitFor(() => expect(auth.closeAuthModal).toHaveBeenCalled());
    expect(auth.refresh).toHaveBeenCalled();
    expect(auth.push).not.toHaveBeenCalled();
  });

  it("shows Check your email when sign-up needs confirming", async () => {
    auth.signUp.mockResolvedValue({ error: null, needsConfirmation: true });
    openModal({ view: "register" });
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    fill("Confirm password", "secret1");
    submit();

    expect(await screen.findByTestId("auth-check")).toHaveTextContent(
      "Link sent",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Check your email.",
    );
    expect(auth.closeAuthModal).not.toHaveBeenCalled();
  });

  it("renders the /scan hold as a one-line card over a scrim", () => {
    const { container } = openModal({
      hold: { kind: "book", label: "The Silver Citadel" },
    });
    expect(
      screen.getByRole("dialog", { name: "Keep your book." }),
    ).toBeInTheDocument();
    expect(screen.getByText("PL. 00 · Sign in")).toBeInTheDocument();
    expect(screen.getByTestId("auth-held")).toHaveTextContent(
      "Held · The Silver Citadel",
    );
    expect(
      screen.getByText(
        "Sign in or create an account to add this book and its unlock.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/auth?mode=register&next=%2Fscan");
    expect(container.querySelector(".sa-folio")).toBeNull();
    expect(screen.getByLabelText("Email")).not.toHaveFocus();
    expect(container.textContent).not.toMatch(/●/);
  });

  it("never fills with signal orange", () => {
    const { container } = openModal({ view: "register" });
    submit();
    expect(
      container.querySelectorAll(
        '[class*="bg-primary"], [class*="bg-signal"], [class*="brand-orange"], [class*="bg-[#"]',
      ),
    ).toHaveLength(0);
    for (const node of container.querySelectorAll(".sa-signal")) {
      expect(node.closest(".sa-mono")).not.toBeNull();
    }
  });
});
