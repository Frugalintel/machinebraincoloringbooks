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
});
