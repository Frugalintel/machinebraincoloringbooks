import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ScanPage from "@/app/scan/page";
import { supabase } from "@/lib/supabase";

const scan = vi.hoisted(() => ({ search: "" }));
const auth = vi.hoisted(() => ({ openAuthModal: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/scan",
  useSearchParams: () => new URLSearchParams(scan.search),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ user: null, openAuthModal: auth.openAuthModal }),
}));

vi.mock("@/context/toast-context", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

describe("/scan entry from the home code form", () => {
  beforeEach(() => {
    scan.search = "";
    auth.openAuthModal.mockReset();
  });

  it("starts on the camera primer without mode=code", () => {
    render(<ScanPage />);
    expect(
      screen.getByRole("button", { name: /turn on camera/i }),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Code")).toBeNull();
  });

  it("opens manual entry with the code trimmed and upper-cased", () => {
    scan.search = "mode=code&code=+ab12+";
    render(<ScanPage />);
    expect(screen.getByPlaceholderText("Code")).toHaveValue("AB12");
    expect(screen.getByPlaceholderText("Code").tagName).toBe("INPUT");
    expect(screen.queryByRole("button", { name: /add \+1/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: /sign in to count/i }),
    ).toHaveAttribute("href", "/auth?mode=login&next=/scan");
    expect(
      screen.getAllByText("Sign in and this code counts toward your book."),
    ).toHaveLength(1);
  });

  it("looks the code up in its normalized form", async () => {
    scan.search = "mode=code";
    const maybeSingle = vi.fn(async () => ({
      data: null,
      error: { message: "x" },
    }));
    const eq = vi.fn(() => ({ maybeSingle, single: maybeSingle }));
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({ eq })),
    } as unknown as ReturnType<typeof supabase.from>);

    render(<ScanPage />);
    const field = screen.getByPlaceholderText("Code");
    expect(field).toHaveValue("");
    fireEvent.change(field, { target: { value: "  xy9 " } });
    fireEvent.submit(field.closest("form")!);

    await waitFor(() => expect(eq).toHaveBeenCalledWith("code", "XY9"));
  });

  it("submits the page code when Enter is pressed in the field", async () => {
    scan.search = "mode=code";
    const maybeSingle = vi.fn(async () => ({
      data: null,
      error: { message: "x" },
    }));
    const eq = vi.fn(() => ({ maybeSingle, single: maybeSingle }));
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({ eq })),
    } as unknown as ReturnType<typeof supabase.from>);

    render(<ScanPage />);
    const field = screen.getByPlaceholderText("Code");
    fireEvent.change(field, { target: { value: "7kq2\n" } });
    expect(field).toHaveValue("7KQ2");
    fireEvent.keyDown(field, { key: "Enter" });

    await waitFor(() => expect(eq).toHaveBeenCalledWith("code", "7KQ2"));
  });

  it("tells a signed-out reader the code looks valid without leaking the plate", async () => {
    scan.search = "mode=code";
    const maybeSingle = vi.fn(async () => ({
      data: {
        id: "code-1",
        code: "7KQ2",
        page_number: 7,
        is_active: true,
        products: { id: "p1", title: "The Silver Citadel" },
      },
      error: null,
    }));
    const eq = vi.fn(() => ({ maybeSingle, single: maybeSingle }));
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({ eq })),
    } as unknown as ReturnType<typeof supabase.from>);

    render(<ScanPage />);
    const field = screen.getByPlaceholderText("Code");
    fireEvent.change(field, { target: { value: "7KQ2" } });
    fireEvent.submit(field.closest("form")!);

    await waitFor(() =>
      expect(auth.openAuthModal).toHaveBeenCalledWith(
        "login",
        undefined,
        "7KQ2",
        expect.objectContaining({ kind: "page-plus", label: "7KQ2" }),
      ),
    );
    expect(screen.queryByRole("heading", { name: "Counted." })).toBeNull();
    expect(screen.queryByText(/plate 07/i)).toBeNull();
    expect(screen.getByText("Code looks valid")).toBeInTheDocument();
    expect(
      screen.getByText(
        "That code looks valid. Sign in or register the book to count it.",
      ),
    ).toBeInTheDocument();
  });
});

describe("/scan preview fixtures", () => {
  beforeEach(() => {
    scan.search = "";
    auth.openAuthModal.mockReset();
  });

  it("keeps signed-in already-counted copy on the code-only-before preview", () => {
    scan.search = "preview=code-only-before";
    render(<ScanPage />);
    expect(screen.getByText("Already counted")).toBeInTheDocument();
    expect(
      screen.getByText("The code for plate 07 is in. The photo is still open."),
    ).toBeInTheDocument();
  });

  it("opens the collected already state from ?preview=collected", () => {
    scan.search = "preview=collected";
    render(<ScanPage />);
    expect(
      screen.getByRole("heading", { name: "Collected." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/plate 07 is in, code and page/i),
    ).toBeInTheDocument();
  });

  it("opens Keep your book for a signed-out back-cover preview", () => {
    scan.search = "preview=signed-out-book";
    render(<ScanPage />);
    expect(auth.openAuthModal).toHaveBeenCalledWith(
      "login",
      undefined,
      undefined,
      expect.objectContaining({ kind: "book" }),
    );
  });

  it("hides wallet points on the live signed-out page and points to sign in", () => {
    render(<ScanPage />);
    expect(screen.queryByText("Wallet · for stories")).toBeNull();
    expect(screen.queryByText(/WALLET/i)).toBeNull();
    expect(
      screen.getByText("Sign in to keep this book and its unlock."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/this code counts/i)).toBeNull();
    expect(screen.queryByText(/not on this build/i)).toBeNull();
    expect(screen.queryByText(/XP/i)).toBeNull();
  });

  it("shows Try again on invalid, without Add +1 or adding now", () => {
    scan.search = "preview=invalid";
    render(<ScanPage />);
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add \+1/i })).toBeNull();
    expect(screen.queryByText(/adding now/i)).toBeNull();
  });

  it("opens the Basic trophy fixture from ?preview=basic", () => {
    scan.search = "preview=basic";
    render(<ScanPage />);
    expect(screen.getByRole("heading", { name: "Basic." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pro." })).toBeNull();
    expect(screen.getByText(/Trophy · Basic/i)).toBeInTheDocument();
    expect(screen.getByText(/moves up to Basic/)).toBeInTheDocument();
  });

  it("opens Rare, Pro and Legendary trophy aliases from preview", () => {
    scan.search = "preview=rare";
    const rare = render(<ScanPage />);
    expect(screen.getByRole("heading", { name: "Rare." })).toBeInTheDocument();
    expect(screen.getByText(/Trophy · Rare/i)).toBeInTheDocument();
    expect(screen.getByText(/moves up to Rare/)).toBeInTheDocument();
    rare.unmount();

    scan.search = "preview=pro";
    const pro = render(<ScanPage />);
    expect(screen.getByRole("heading", { name: "Pro." })).toBeInTheDocument();
    expect(screen.getByText(/Trophy · Pro/i)).toBeInTheDocument();
    pro.unmount();

    scan.search = "preview=legendary";
    render(<ScanPage />);
    expect(
      screen.getByRole("heading", { name: "Legendary." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Legendary found/i)).toBeInTheDocument();
  });

  it.each(["photo", "photo-preview"] as const)(
    "shows the +1 counted chip on %s",
    (state) => {
      scan.search = `preview=${state}`;
      render(<ScanPage />);
      expect(screen.getByText("+1 counted")).toBeInTheDocument();
      expect(
        screen.getByText(/The Silver Citadel · PL\. 07/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/optional · \+1 more once verified/i),
      ).toBeInTheDocument();
    },
  );
});

describe("/scan camera start", () => {
  beforeEach(() => {
    scan.search = "";
    auth.openAuthModal.mockReset();
  });

  it("calls getUserMedia from Turn on camera on a secure page", async () => {
    const getUserMedia = vi.fn(async () => ({
      getTracks: () => [{ stop: vi.fn() }],
    }));
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    render(<ScanPage />);
    fireEvent.click(screen.getByRole("button", { name: /turn on camera/i }));

    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
  });

  it("opens insecure and no-camera fixtures from preview aliases", () => {
    scan.search = "preview=camera-insecure";
    const insecure = render(<ScanPage />);
    expect(screen.getByText("Not secure")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /turn on camera/i }),
    ).toBeNull();
    insecure.unmount();

    scan.search = "preview=camera-none";
    render(<ScanPage />);
    expect(screen.getByText("No camera")).toBeInTheDocument();
    expect(screen.queryByText("Not secure")).toBeNull();
    expect(screen.queryByText("Blocked")).toBeNull();
  });
});

describe("/scan source guardrails", () => {
  it("does not toast a red camera error; the Camera off state explains it", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/scan/scan-page-client.tsx"),
      "utf8",
    );
    expect(source).toMatch(/setState\("camera-off"\)/);
    expect(source).toMatch(/requestCameraAccess/);
    expect(source).toMatch(/createCapturedImageUrl/);
    expect(source).toMatch(/revokeCapturedImageUrl/);
    expect(source).not.toMatch(/toastError\(msg\)/);
    expect(source).not.toMatch(/Shown from XP/);
    expect(source).not.toMatch(/fetch\(capturedUrl\)/);
    expect(source).not.toMatch(/readAsDataURL/);
  });

  it("sizes long page codes to one line instead of clipping", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/scan/scan-ledger.css"),
      "utf8",
    );
    expect(css).toMatch(/--len/);
    expect(css).toMatch(/min\(clamp\(48px, 8vw, 150px\)/);
    expect(css).toMatch(/overflow-wrap:\s*anywhere/);
    expect(css).not.toMatch(/word-break:\s*break-all/);
    const headline = css.match(/\.home-e2\.scan-c \.h1 \{[\s\S]*?\n\}/);
    expect(headline?.[0]).toMatch(/overflow:\s*visible/);
    expect(headline?.[0]).not.toMatch(/overflow:\s*hidden/);
  });
});
