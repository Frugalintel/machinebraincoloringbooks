import { describe, expect, it, vi } from "vitest";
import {
  cameraCanStart,
  cameraIssueCopy,
  classifyCameraError,
  isIosSafari,
  requestCameraAccess,
  stopCameraStream,
} from "@/lib/scan-ledger/camera";

function namedError(name: string, message = name): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

describe("classifyCameraError", () => {
  it("maps permission denial", () => {
    expect(classifyCameraError(namedError("NotAllowedError"))).toEqual({
      kind: "denied",
    });
  });

  it("maps missing or overconstrained cameras", () => {
    expect(classifyCameraError(namedError("NotFoundError"))).toEqual({
      kind: "not-found",
    });
    expect(classifyCameraError(namedError("OverconstrainedError"))).toEqual({
      kind: "not-found",
    });
  });

  it("keeps the message on other real errors", () => {
    expect(
      classifyCameraError(namedError("NotReadableError", "Track failed")),
    ).toEqual({
      kind: "error",
      message: "Track failed",
    });
  });
});

describe("cameraIssueCopy", () => {
  it("uses one insecure message", () => {
    expect(cameraIssueCopy({ kind: "insecure" })).toEqual({
      title: "Not secure",
      body: "The camera only opens over https. Page codes can always be typed.",
    });
  });

  it("uses browser-neutral permission wording unless the UA is iOS Safari", () => {
    expect(cameraIssueCopy({ kind: "denied" }).body).toMatch(
      /browser settings/i,
    );
    expect(cameraIssueCopy({ kind: "denied" }).body).not.toMatch(/Safari/);
    expect(
      cameraIssueCopy(
        { kind: "denied" },
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ).body,
    ).toMatch(/Safari/);
  });

  it("explains a missing camera and uses fixed copy for other errors", () => {
    expect(cameraIssueCopy({ kind: "not-found" }).title).toBe("No camera");
    expect(
      cameraIssueCopy({ kind: "error", message: "Track failed" }).body,
    ).toBe("The camera didn't start. Type a page code instead.");
  });
});

describe("isIosSafari", () => {
  it("accepts iPhone Safari and rejects Chrome on iOS", () => {
    expect(
      isIosSafari(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(true);
    expect(
      isIosSafari(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
  });
});

describe("requestCameraAccess", () => {
  it("does not call getUserMedia in an insecure context", async () => {
    const getUserMedia = vi.fn();
    await expect(
      requestCameraAccess({ isSecureContext: false, getUserMedia }),
    ).resolves.toEqual({ ok: false, issue: { kind: "insecure" } });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("starts the camera from a user gesture when getUserMedia is present", async () => {
    const stream = {
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn(async () => stream);
    await expect(
      requestCameraAccess({ isSecureContext: true, getUserMedia }),
    ).resolves.toEqual({ ok: true, stream });
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
      audio: false,
    });
  });

  it("classifies a getUserMedia rejection", async () => {
    const getUserMedia = vi.fn(async () => {
      throw namedError("NotAllowedError");
    });
    await expect(
      requestCameraAccess({ isSecureContext: true, getUserMedia }),
    ).resolves.toEqual({ ok: false, issue: { kind: "denied" } });
  });

  it("hides start when the context or API cannot work", () => {
    expect(
      cameraCanStart({ isSecureContext: false, hasGetUserMedia: true }),
    ).toBe(false);
    expect(
      cameraCanStart({ isSecureContext: true, hasGetUserMedia: false }),
    ).toBe(false);
    expect(
      cameraCanStart({ isSecureContext: true, hasGetUserMedia: true }),
    ).toBe(true);
  });

  it("stops tracks from a granted stream", () => {
    const stop = vi.fn();
    stopCameraStream({ getTracks: () => [{ stop }] } as unknown as MediaStream);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
