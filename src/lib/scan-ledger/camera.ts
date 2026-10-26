import { CAMERA_INSECURE } from "@/lib/scan-ledger/copy";
import { logger } from "@/lib/logger";

export type CameraIssue =
  | { kind: "insecure" }
  | { kind: "denied" }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

export const CAMERA_BLOCKED_GENERIC =
  "Allow camera access in your browser settings, then reload.";
export const CAMERA_BLOCKED_SAFARI =
  "Settings › Safari › Camera › Allow, then reload.";
export const CAMERA_NO_CAMERA =
  "No camera was found. Type a page code instead.";
export const CAMERA_FAILED =
  "The camera didn't start. Type a page code instead.";

function errorName(error: unknown): string {
  if (error && typeof error === "object" && "name" in error) {
    return String((error as { name: unknown }).name);
  }
  return "";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }
  return "The camera could not be started.";
}

export function classifyCameraError(error: unknown): CameraIssue {
  switch (errorName(error)) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return { kind: "denied" };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return { kind: "not-found" };
    default: {
      const message = errorMessage(error);
      logger.error("scan camera error", error, { message });
      return { kind: "error", message };
    }
  }
}

export function isIosSafari(ua: string): boolean {
  const ios =
    /iP(hone|ad|od)/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua));
  const safari =
    /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);
  return ios && safari;
}

export function cameraIssueCopy(
  issue: CameraIssue,
  ua = "",
): { title: string; body: string } {
  switch (issue.kind) {
    case "insecure":
      return {
        title: "Not secure",
        body: CAMERA_INSECURE,
      };
    case "denied":
      return {
        title: "Blocked",
        body: isIosSafari(ua) ? CAMERA_BLOCKED_SAFARI : CAMERA_BLOCKED_GENERIC,
      };
    case "not-found":
      return {
        title: "No camera",
        body: CAMERA_NO_CAMERA,
      };
    case "error":
      return {
        title: "Camera",
        body: CAMERA_FAILED,
      };
    default: {
      const _exhaustive: never = issue;
      return _exhaustive;
    }
  }
}

export function cameraCanStart(input: {
  isSecureContext: boolean;
  hasGetUserMedia: boolean;
}): boolean {
  return input.isSecureContext && input.hasGetUserMedia;
}

export async function requestCameraAccess(input: {
  isSecureContext: boolean;
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
}): Promise<
  { ok: true; stream: MediaStream } | { ok: false; issue: CameraIssue }
> {
  if (!input.isSecureContext) {
    return { ok: false, issue: { kind: "insecure" } };
  }
  if (!input.getUserMedia) {
    const message = "Camera is not available in this browser.";
    logger.error("scan camera error", message);
    return {
      ok: false,
      issue: { kind: "error", message },
    };
  }
  try {
    const stream = await input.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    return { ok: true, stream };
  } catch (error) {
    return { ok: false, issue: classifyCameraError(error) };
  }
}

export function stopCameraStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
