import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage from "@/app/profile/[username]/page";
import type { ScanLedgerSnapshot } from "@/lib/scan-ledger";

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

const game = vi.hoisted(() => ({
  isLoading: false,
  activeAchievementIds: [] as string[],
}));

vi.mock("@/context/game-context", () => ({
  useGame: () => ({
    collectionSets: [],
    achievements: [],
    activeAchievementIds: game.activeAchievementIds,
    collectibleTimestamps: {},
    isLoading: game.isLoading,
  }),
}));

const ledger = vi.hoisted(() => {
  const snapshot: ScanLedgerSnapshot = {
    signedIn: true,
    sample: false,
    wallet: { available: false, points: null, source: "unavailable" },
    story: null,
    books: [
      {
        id: "s",
        title: "The Silver Citadel",
        plateCount: 40,
        bookPoints: 13,
        plates: [
          ...Array.from({ length: 7 }, () => "code" as const),
          ...Array.from({ length: 3 }, () => "pending" as const),
          ...Array.from({ length: 30 }, () => "empty" as const),
        ],
        currentPlate: null,
        hitPlate: null,
        legendaryPlate: null,
        legendaryFoundAt: null,
        allCodesIn: false,
        pendingCount: 3,
        tier: "Basic",
        next: "",
      },
    ],
    showNextBookSlot: false,
    activePlate: null,
    unlock: null,
  };
  return { snapshot };
});

vi.mock("@/lib/scan-ledger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/scan-ledger")>();
  return {
    ...actual,
    loadLedger: vi.fn(async () => ledger.snapshot),
  };
});

describe("ProfilePage auth resolution", () => {
  beforeEach(() => {
    auth.isLoading = true;
    auth.user = null;
    game.isLoading = false;
    game.activeAchievementIds = [];
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
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

  it("keeps /profile/me on Loading profile when the session is signed out", () => {
    auth.isLoading = false;
    render(<ProfilePage />);
    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(screen.queryByText("GUEST")).toBeNull();
    expect(screen.queryByText("Access Restricted")).toBeNull();
  });

  it("holds plate and loadout counts until the ledger and game data resolve", () => {
    auth.isLoading = false;
    auth.user = { email: "ada@example.com", id: "user-1", initials: "AD" };
    game.isLoading = true;
    render(<ProfilePage />);
    expect(
      screen.getByRole("button", { name: /Manage Loadout \(—\/5\)/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("0/5")).toBeNull();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("shows the signed-in profile once the session exists", async () => {
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
    await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());
  });

  it("reads plates and pending from the scan ledger", async () => {
    auth.isLoading = false;
    auth.user = { email: "ada@example.com", id: "user-1", initials: "AD" };
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());
    expect(screen.getByText("Plates")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("The Silver Citadel")).toBeInTheDocument();
    expect(screen.getByText("10/40")).toBeInTheDocument();
    expect(screen.getByText("3 pending")).toBeInTheDocument();
  });
});
