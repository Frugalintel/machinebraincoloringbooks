import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage from "@/app/profile/[username]/page";

const auth = vi.hoisted(() => ({
  isLoading: true,
  user: null as null | { email: string; id: string; initials: string },
  signOut: vi.fn(),
  openAuthModal: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
  useParams: () => ({ username: "me" }),
  usePathname: () => "/profile/me",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: () => auth,
}));

vi.mock("@/context/game-context", () => ({
  useGame: () => ({
    collectionSets: [],
    achievements: [],
    activeAchievementIds: [],
    collectibleTimestamps: {},
  }),
}));

describe("ProfilePage auth resolution", () => {
  beforeEach(() => {
    auth.isLoading = true;
    auth.user = null;
  });

  it("shows Loading profile until the session resolves", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(screen.queryByText("GUEST")).toBeNull();
    expect(screen.queryByText("Access Restricted")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Authenticate User" }),
    ).toBeNull();
  });

  it("shows the restricted state only after auth resolves signed out", () => {
    auth.isLoading = false;
    render(<ProfilePage />);
    expect(screen.getByText("GUEST")).toBeInTheDocument();
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Authenticate User" }),
    ).toBeInTheDocument();
  });

  it("shows the signed-in profile once the session exists", () => {
    auth.isLoading = false;
    auth.user = { email: "ada@example.com", id: "user-1", initials: "AD" };
    render(<ProfilePage />);
    expect(screen.queryByText("Access Restricted")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "USER_AD" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Sign out" }).length,
    ).toBeGreaterThan(0);
  });
});
