import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureSnapshot } from "@/lib/scan-ledger";
import type { ScanLedgerSnapshot } from "@/lib/scan-ledger/types";
import { ScanLedgerView, type ScanLedgerHandlers } from "./scan-ledger-view";

const handlers: ScanLedgerHandlers = {
  onEnableCamera: vi.fn(),
  onMode: vi.fn(),
  onCodeChange: vi.fn(),
  onSubmitCode: vi.fn(),
  onAddPhoto: vi.fn(),
  onSkipPhoto: vi.fn(),
  onShutter: vi.fn(),
  onUploadFile: vi.fn(),
  onSendPhoto: vi.fn(),
  onRetake: vi.fn(),
  onAnotherCode: vi.fn(),
};

function renderView(
  state: Parameters<typeof ScanLedgerView>[0]["state"],
  snapshot: ScanLedgerSnapshot = fixtureSnapshot(state),
  extra: Partial<Parameters<typeof ScanLedgerView>[0]> = {},
) {
  return render(
    <ScanLedgerView
      state={state}
      snapshot={snapshot}
      typedCode={state === "invalid" ? "7KQ3" : "7KQ2"}
      capturedUrl={null}
      cameraLive={false}
      cameraIssue={null}
      sending={false}
      reducedMotion
      notice={null}
      handlers={handlers}
      {...extra}
    />,
  );
}

describe("ScanLedgerView wallet and photo register", () => {
  it("hides .bal when the wallet is unavailable for a signed-in reader", () => {
    const snapshot: ScanLedgerSnapshot = {
      ...fixtureSnapshot("code"),
      signedIn: true,
      wallet: { available: false, points: null, source: "unavailable" },
    };
    const { container } = renderView("code", snapshot);
    expect(container.querySelector(".bal")).toBeNull();
    expect(screen.queryByText(/not on this build/i)).toBeNull();
    expect(screen.queryByText(/XP/i)).toBeNull();
  });

  it("labels XP-backed points as Wallet · from your points", () => {
    const snapshot: ScanLedgerSnapshot = {
      ...fixtureSnapshot("code"),
      signedIn: true,
      wallet: { available: true, points: 12, source: "xp" },
    };
    renderView("code", snapshot);
    expect(screen.getByText("Wallet · from your points")).toBeInTheDocument();
    expect(screen.queryByText(/XP/i)).toBeNull();
  });

  it("hides the +1 counted chip when the live photo path has no plate", () => {
    const snapshot: ScanLedgerSnapshot = {
      ...fixtureSnapshot("photo"),
      sample: false,
      activePlate: null,
    };
    const { container } = renderView("photo", snapshot);
    expect(screen.queryByText("+1 counted")).toBeNull();
    expect(container.querySelector(".vchip")).toBeNull();
  });

  it("keeps the sample +1 counted chip on the photo preview fixture", () => {
    renderView("photo");
    expect(screen.getByText("+1 counted")).toBeInTheDocument();
    expect(
      screen.getByText(/The Silver Citadel · PL\. 07/i),
    ).toBeInTheDocument();
  });

  it("uses the mockup now-cell labels on the highlighted plate", () => {
    renderView("code-only-before");
    expect(
      screen.getByTitle("Plate 07: code counted, photo still open"),
    ).toBeInTheDocument();
    renderView("collected");
    expect(
      screen.getByTitle("Plate 07: collected already, code and page"),
    ).toBeInTheDocument();
    renderView("tier-reached");
    expect(
      screen.getByTitle("Plate 19: photo just verified, 2 pts"),
    ).toBeInTheDocument();
  });

  it("uses Basic chrome on the Basic trophy fixture", () => {
    renderView(
      "tier-reached",
      fixtureSnapshot("tier-reached", { trophyTier: "Basic" }),
    );
    expect(screen.getByRole("heading", { name: "Basic." })).toBeInTheDocument();
    expect(screen.getByText(/Trophy · Basic/i)).toBeInTheDocument();
    expect(screen.getByText(/moves up to Basic/)).toBeInTheDocument();
    expect(
      screen.getByText(/The Silver Citadel has 41 book pts/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/The Silver Citadel has 45 book pts/)).toBeNull();
    expect(screen.queryByText(/moves up to Pro/)).toBeNull();
  });

  it("uses Rare chrome on the Rare trophy fixture", () => {
    renderView(
      "tier-reached",
      fixtureSnapshot("tier-reached", { trophyTier: "Rare" }),
    );
    expect(screen.getByRole("heading", { name: "Rare." })).toBeInTheDocument();
    expect(
      screen.getByText(/The Silver Citadel has 55 book pts/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/The Silver Citadel has 45 book pts/)).toBeNull();
  });

  it("keeps live tier-reached copy at 45 book pts", () => {
    const snapshot: ScanLedgerSnapshot = {
      ...fixtureSnapshot("tier-reached", { trophyTier: "Pro" }),
      sample: false,
      books: fixtureSnapshot("tier-reached").books.map((book, index) =>
        index === 0 ? { ...book, bookPoints: 99 } : book,
      ),
    };
    renderView("tier-reached", snapshot);
    expect(
      screen.getByText(/The Silver Citadel has 45 book pts/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/The Silver Citadel has 99 book pts/)).toBeNull();
  });

  it("keeps signed-in already-counted copy on the code form", () => {
    renderView("code-only-before");
    expect(screen.getByText("Already counted")).toBeInTheDocument();
    expect(
      screen.getByText("The code for plate 07 is in. The photo is still open."),
    ).toBeInTheDocument();
  });

  it("shows a photo send failure next to Send it and keeps the button usable", () => {
    renderView("photo-preview", fixtureSnapshot("photo-preview"), {
      sendError: "Something went wrong. Try again.",
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong. Try again.");
    expect(
      alert.compareDocumentPosition(
        screen.getByRole("button", { name: /send it/i }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_PRECEDING);
    expect(screen.getByRole("button", { name: /send it/i })).toBeEnabled();
  });

  it("captions the legendary trophy as a hidden page", () => {
    renderView("legendary-found");
    expect(
      screen.getAllByText("PLATE 31 · HIDDEN PAGE").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("PLATE 31 · 9TD4 · CODE + PHOTO")).toBeNull();
  });
});

describe("ScanLedgerView signed-out code, camera, plate, and preview", () => {
  it("hides wallet points and Add +1 when signed out, and links to sign in", () => {
    const snapshot: ScanLedgerSnapshot = {
      ...fixtureSnapshot("code"),
      signedIn: false,
      wallet: { available: false, points: null, source: "unavailable" },
    };
    const { container } = renderView("code", snapshot);
    expect(container.querySelector(".bal")).toBeNull();
    expect(screen.queryByText("Wallet · for stories")).toBeNull();
    expect(screen.queryByRole("button", { name: /add \+1/i })).toBeNull();
    expect(
      screen.getAllByText("Sign in and this code counts toward your book."),
    ).toHaveLength(1);
    expect(
      screen.queryByText(/it is not added while you are signed out/i),
    ).toBeNull();
    const signIn = screen.getAllByRole("link", { name: /sign in/i });
    expect(signIn).toHaveLength(1);
    expect(signIn[0]).toHaveAttribute(
      "href",
      "/auth?mode=login&next=/scan%3Fmode%3Dcode%26code%3D7KQ2",
    );
  });

  it("uses book copy on a signed-out camera page, not code copy", () => {
    renderView("camera-off", {
      ...fixtureSnapshot("camera-off"),
      signedIn: false,
    });
    expect(
      screen.getByText("Sign in to keep this book and its unlock."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/this code counts/i)).toBeNull();
  });

  it("shows · sample on fixture photos only", () => {
    const fixture = renderView(
      "photo-preview",
      fixtureSnapshot("photo-preview"),
      { capturedUrl: "blob:http://localhost/user-photo" },
    );
    expect(screen.getAllByText("Your photo · sample").length).toBeGreaterThan(
      0,
    );
    fixture.unmount();
    renderView(
      "photo-preview",
      { ...fixtureSnapshot("photo-preview"), sample: false },
      { capturedUrl: "blob:http://localhost/user-photo" },
    );
    expect(screen.getAllByText("Your photo").length).toBeGreaterThan(0);
    expect(screen.queryByText("Your photo · sample")).toBeNull();
  });

  it("shows only the camera issue that applies and hides start when it cannot work", () => {
    const insecure = renderView("camera-off", fixtureSnapshot("camera-off"), {
      cameraIssue: { kind: "insecure" },
    });
    expect(screen.getByText("Not secure")).toBeInTheDocument();
    expect(screen.queryByText("Blocked")).toBeNull();
    expect(screen.queryByText("No camera")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /turn on camera/i }),
    ).toBeNull();
    insecure.unmount();

    renderView("camera-off", fixtureSnapshot("camera-off"), {
      cameraIssue: { kind: "denied" },
    });
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText(/browser settings/i)).toBeInTheDocument();
    expect(screen.queryByText("Not secure")).toBeNull();
    expect(
      screen.getByRole("button", { name: /turn on camera/i }),
    ).toBeInTheDocument();
  });

  it("captions pending and verified states with the active plate, not 07", () => {
    const snapshot: ScanLedgerSnapshot = {
      ...fixtureSnapshot("pending"),
      activePlate: {
        plate: "04",
        code: "QA-TEST-P04",
        title: "Page",
        bookTitle: "The Silver Citadel",
      },
    };
    renderView("pending", snapshot);
    expect(screen.getByText("Plate 04 · code + photo")).toBeInTheDocument();
    expect(screen.queryByText("Plate 07 · code + photo")).toBeNull();
  });

  it("shows the captured object URL instead of the stock plate image", () => {
    const { container } = renderView(
      "photo-preview",
      fixtureSnapshot("photo-preview"),
      { capturedUrl: "blob:http://localhost/user-photo" },
    );
    const photo = container.querySelector(".pvw img");
    expect(photo).toHaveAttribute("src", "blob:http://localhost/user-photo");
    expect(photo).not.toHaveAttribute("src", "/home/plate-color.webp");
  });
});
