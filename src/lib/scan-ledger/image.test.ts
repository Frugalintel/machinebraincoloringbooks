import { describe, expect, it } from "vitest";
import {
  blobFromCapturedImage,
  blobFromDataUrl,
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
