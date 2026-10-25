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
) {
  return render(
    <ScanLedgerView
      state={state}
      snapshot={snapshot}
      typedCode={state === "invalid" ? "7KQ3" : "7KQ2"}
      capturedUrl={null}
      cameraLive={false}
      cameraBlocked={false}
      insecure={false}
      sending={false}
      reducedMotion
      notice={null}
      handlers={handlers}
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

  it("captions the legendary trophy as a hidden page", () => {
    renderView("legendary-found");
    expect(
      screen.getAllByText("PLATE 31 · HIDDEN PAGE").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("PLATE 31 · 9TD4 · CODE + PHOTO")).toBeNull();
  });
});
