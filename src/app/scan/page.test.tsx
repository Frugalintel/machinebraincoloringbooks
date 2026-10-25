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
    expect(screen.getByRole("button", { name: /add \+1/i })).not.toBeDisabled();
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
});

describe("/scan preview fixtures", () => {
  beforeEach(() => {
    scan.search = "";
    auth.openAuthModal.mockReset();
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
});
