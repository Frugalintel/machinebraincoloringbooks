import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ScanPage from "@/app/scan/page";
import { supabase } from "@/lib/supabase";

const scan = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/scan",
  useSearchParams: () => new URLSearchParams(scan.search),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ user: null, openAuthModal: vi.fn() }),
}));

vi.mock("@/context/toast-context", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

describe("/scan entry from the home code form", () => {
  beforeEach(() => {
    scan.search = "";
  });

  it("starts on the camera primer without mode=code", () => {
    render(<ScanPage />);
    expect(
      screen.getByRole("button", { name: "Enable Camera" }),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("ENTER CODE")).toBeNull();
  });

  it("opens manual entry with the code trimmed and upper-cased", () => {
    scan.search = "mode=code&code=+ab12+";
    render(<ScanPage />);
    expect(screen.getByPlaceholderText("ENTER CODE")).toHaveValue("AB12");
    expect(
      screen.getByRole("button", { name: "Verify Code" }),
    ).not.toBeDisabled();
  });

  it("looks the code up in its normalized form", async () => {
    scan.search = "mode=code";
    const single = vi.fn(async () => ({ data: null, error: { message: "x" } }));
    const eq = vi.fn(() => ({ single }));
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({ eq })),
    } as unknown as ReturnType<typeof supabase.from>);

    render(<ScanPage />);
    const field = screen.getByPlaceholderText("ENTER CODE");
    expect(field).toHaveValue("");
    fireEvent.change(field, { target: { value: "  xy9 " } });
    fireEvent.submit(field.closest("form")!);

    await waitFor(() => expect(eq).toHaveBeenCalledWith("code", "XY9"));
  });
});
