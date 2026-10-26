import type { CameraIssue } from "@/lib/scan-ledger/camera";
import type { ScanViewState } from "@/lib/scan-ledger/types";
import type { TrophyTierName } from "@/lib/scan-tiers";

export const SCAN_PREVIEW_STATES: readonly ScanViewState[] = [
  "signed-out-book",
  "signed-out-code",
  "camera-off",
  "index",
  "registered",
  "code",
  "code-added",
  "photo",
  "photo-preview",
  "pending",
  "verified",
  "tier-reached",
  "legendary-found",
  "code-only-before",
  "collected",
  "invalid",
] as const;

const PREVIEW_ALIASES: Record<string, ScanViewState> = {
  qr: "index",
  "back-cover": "index",
  "points-code": "code-added",
  "points-photo": "pending",
  basic: "tier-reached",
  pro: "tier-reached",
  rare: "tier-reached",
  legendary: "legendary-found",
  "camera-insecure": "camera-off",
  "camera-none": "camera-off",
};

const TROPHY_PREVIEW_TIERS: Record<string, TrophyTierName> = {
  basic: "Basic",
  pro: "Pro",
  rare: "Rare",
  legendary: "Legendary",
};

export function scanPreview(
  allowFixture: boolean,
  value: string | null,
): ScanViewState | null {
  if (!allowFixture || !value) return null;
  if ((SCAN_PREVIEW_STATES as readonly string[]).includes(value)) {
    return value as ScanViewState;
  }
  return PREVIEW_ALIASES[value] ?? null;
}

export function isScanPreviewState(value: string): value is ScanViewState {
  return (SCAN_PREVIEW_STATES as readonly string[]).includes(value);
}

export function scanPreviewTrophyTier(
  allowFixture: boolean,
  value: string | null,
): TrophyTierName | null {
  if (!allowFixture || !value) return null;
  return TROPHY_PREVIEW_TIERS[value] ?? null;
}

export function scanPreviewCameraIssue(
  allowFixture: boolean,
  value: string | null,
): CameraIssue | null {
  if (!allowFixture || !value) return null;
  switch (value) {
    case "camera-insecure":
      return { kind: "insecure" };
    case "camera-none":
      return { kind: "not-found" };
    case "camera-off":
      return { kind: "denied" };
    default:
      return null;
  }
}
