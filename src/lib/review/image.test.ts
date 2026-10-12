import { describe, expect, it } from "vitest";
import {
  detectAllowedImageType,
  isDisallowedDeclaredImageType,
} from "@/lib/review/image";

describe("review image uploads", () => {
  it("accepts PNG, JPEG, and WebP magic bytes", () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectAllowedImageType(png)).toBe("image/png");
    expect(detectAllowedImageType(jpeg)).toBe("image/jpeg");
    expect(detectAllowedImageType(webp)).toBe("image/webp");
  });

  it("rejects SVG and other non-allowed bytes", () => {
    const svg = new TextEncoder().encode(
      "<svg xmlns='http://www.w3.org/2000/svg'></svg>",
    );
    expect(detectAllowedImageType(svg)).toBeNull();
    expect(
      detectAllowedImageType(new Uint8Array([0x47, 0x49, 0x46, 0x38])),
    ).toBeNull();
    expect(isDisallowedDeclaredImageType("image/svg+xml")).toBe(true);
    expect(isDisallowedDeclaredImageType("image/png")).toBe(false);
  });
});
