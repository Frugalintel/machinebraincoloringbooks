import { describe, expect, it } from "vitest";
import { parseManifest } from "@/lib/review/manifest";

describe("review manifest", () => {
  it("parses a generic cover/pages/matter manifest", () => {
    const manifest = parseManifest({
      slug: "demo-book",
      title: "Demo",
      version: 2,
      cover: {
        template: "books/demo-book/cover/cover.template.html",
        fields_default: { title: "Demo", print: false },
        width: 5219,
        height: 3375,
        folds_x: [2588, 2631],
        parts: ["front", "spine", "back"],
      },
      front_matter: [
        {
          id: "title",
          template: "books/demo-book/matter/title.template.html",
          fields_default: { title__title: "Demo" },
          width: 2588,
          height: 3375,
        },
      ],
      pages: [{ id: "p01", number: 1, color: "books/demo-book/color/p01.jpg" }],
      back_matter: [],
    });
    expect(manifest.slug).toBe("demo-book");
    expect(manifest.cover.folds_x).toEqual([2588, 2631]);
    expect(manifest.pages[0]?.id).toBe("p01");
    expect(manifest.front_matter[0]?.id).toBe("title");
  });

  it("rejects a missing cover", () => {
    expect(() => parseManifest({ slug: "x" })).toThrow(/cover.template/);
  });
});
