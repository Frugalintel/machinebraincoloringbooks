import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthModal } from "@/components/auth-modal";

const auth = vi.hoisted(() => ({
  authModal: {
    isOpen: true,
    view: "login" as "login" | "register",
    email: undefined as string | undefined,
  },
  closeAuthModal: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: auth.push, refresh: auth.refresh }),
  usePathname: () => "/store",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    authModal: auth.authModal,
    closeAuthModal: auth.closeAuthModal,
    signIn: auth.signIn,
    signUp: auth.signUp,
  }),
}));

function openModal(view: "login" | "register" = "login", email?: string) {
  auth.authModal = { isOpen: true, view, email };
  return render(<AuthModal />);
}

function submit() {
  fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
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

describe("AuthModal", () => {
  it("renders nothing when closed", () => {
    auth.authModal = { isOpen: false, view: "login", email: undefined };
    const { container } = render(<AuthModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a labelled modal dialog with the shared panel and no Redaction", () => {
    const { container } = openModal();

    const dialog = screen.getByRole("dialog", { name: "Welcome back" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass(
      "font-heading",
    );
    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelectorAll(".font-display")).toHaveLength(0);
    expect(screen.getByTestId("auth-label")).toHaveClass(
      "font-label",
      "text-signal",
    );
    expect(container.querySelector('img[src^="/brand/"]')).toHaveAttribute(
      "src",
      "/brand/mb-mark-full-cream.svg",
    );
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(container.textContent).not.toMatch(
      /google|apple|facebook|twitter|forgot|!/i,
    );
  });

  it("opens on the requested view with the passed email", () => {
    openModal("register", "you@example.com");
    expect(
      screen.getByRole("dialog", { name: "Create your account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("you@example.com");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("closes on Escape, the close button and the backdrop", () => {
    openModal();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByTestId("auth-modal-backdrop"));
    expect(auth.closeAuthModal).toHaveBeenCalledTimes(3);
  });

  it("ties inline errors to fields", () => {
    openModal();
    fill("Email", "you@example.com");
    submit();

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAccessibleDescription("Enter your password.");
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

    const busy = screen.getByRole("button", { name: /signing in/i });
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(busy).toBeDisabled();
    expect(auth.signIn).toHaveBeenCalledWith("you@example.com", "secret1");

    await act(async () => {
      resolve({ error: new Error("Invalid login credentials") });
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your email or password is incorrect.",
    );
    expect(auth.closeAuthModal).not.toHaveBeenCalled();
  });

  it("refreshes and closes in place on success, without redirecting", async () => {
    auth.signIn.mockResolvedValue({ error: null });
    openModal();
    fill("Email", "you@example.com");
    fill("Password", "secret1");
    submit();

    await waitFor(() => expect(auth.closeAuthModal).toHaveBeenCalled());
    expect(auth.refresh).toHaveBeenCalled();
    expect(auth.push).not.toHaveBeenCalled();
  });

  it("never fills with signal orange", () => {
    const { container } = openModal("register");
    submit();
    expect(
      container.querySelectorAll(
        '[class*="bg-primary"], [class*="bg-signal"], [class*="brand-orange"], [class*="bg-[#"]',
      ),
    ).toHaveLength(0);
    expect(container.querySelectorAll('[class*="signal"]')).toHaveLength(1);
  });
});
