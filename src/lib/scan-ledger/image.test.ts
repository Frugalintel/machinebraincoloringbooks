import { afterEach, describe, expect, it, vi } from "vitest";
import {
  blobFromCapturedImage,
  blobFromDataUrl,
  createCapturedImageUrl,
  revokeCapturedImageUrl,
} from "@/lib/scan-ledger/image";

describe("blobFromDataUrl", () => {
  it("decodes a data URL without fetch", () => {
    const blob = blobFromDataUrl("data:image/jpeg;base64,QQ==");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/jpeg");
    expect(blob.size).toBe(1);
  });

  it("rejects non-data URLs so callers cannot fetch them", () => {
    expect(() => blobFromDataUrl("https://example.com/page.jpg")).toThrow(
      /data url/i,
    );
  });
});

describe("blobFromCapturedImage", () => {
  it("returns a File or Blob as-is", async () => {
    const file = new File(["x"], "page.jpg", { type: "image/jpeg" });
    await expect(blobFromCapturedImage(file)).resolves.toBe(file);
  });

  it("converts a data URL to a Blob", async () => {
    const blob = await blobFromCapturedImage("data:image/jpeg;base64,QQ==");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/jpeg");
    expect(blob.size).toBe(1);
  });
});

describe("captured image object URLs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates an object URL from the selected file", () => {
    const createObjectURL = vi.fn(() => "blob:http://localhost/user-photo");
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const file = new File(["page"], "page.jpg", { type: "image/jpeg" });
    expect(createCapturedImageUrl(file)).toBe(
      "blob:http://localhost/user-photo",
    );
    expect(createObjectURL).toHaveBeenCalledWith(file);
  });

  it("revokes blob URLs and leaves other srcs alone", () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(), revokeObjectURL });
    revokeCapturedImageUrl("blob:http://localhost/user-photo");
    revokeCapturedImageUrl("/home/plate-color.webp");
    revokeCapturedImageUrl(null);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(
      "blob:http://localhost/user-photo",
    );
  });
});
