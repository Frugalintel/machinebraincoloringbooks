import { describe, expect, it } from "vitest";
import {
  isSrcFieldKey,
  parseReviewSlug,
  resolveBucketPath,
  uploadPathForSlug,
} from "@/lib/review/paths";

describe("review paths", () => {
  it("accepts kebab slugs only", () => {
    expect(parseReviewSlug("ottoline-garden")).toBe("ottoline-garden");
    expect(parseReviewSlug("../secret")).toBeNull();
    expect(parseReviewSlug("Ottoline")).toBeNull();
  });

  it("resolves template-relative assets", () => {
    expect(
      resolveBucketPath(
        "books/ottoline-garden/cover/cover.template.html",
        "assets/tile-p05.svg",
      ),
    ).toBe("books/ottoline-garden/cover/assets/tile-p05.svg");
    expect(
      resolveBucketPath(
        "books/ottoline-garden/matter/title.template.html",
        "../frame/matter-border.recto.png",
      ),
    ).toBe("books/ottoline-garden/frame/matter-border.recto.png");
  });

  it("rejects escapes outside the bucket prefix", () => {
    expect(
      resolveBucketPath("books/ottoline-garden/cover/cover.html", "../../../../etc/passwd"),
    ).toBeNull();
  });

  it("treats logo and *_src keys as image fields", () => {
    expect(isSrcFieldKey("logo_src")).toBe(true);
    expect(isSrcFieldKey("title__spot_art_src")).toBe(true);
    expect(isSrcFieldKey("title")).toBe(false);
  });

  it("writes uploads under the book prefix", () => {
    const path = uploadPathForSlug("ottoline-garden", "Brand Logo.PNG");
    expect(path.startsWith("books/ottoline-garden/uploads/")).toBe(true);
    expect(path.endsWith("-Brand_Logo.PNG")).toBe(true);
  });
});
