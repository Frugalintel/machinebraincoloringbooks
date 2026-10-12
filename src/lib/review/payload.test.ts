import { describe, expect, it } from "vitest";
import {
  buildSubmissionPayload,
  createDraftFromBook,
  mergeDraft,
  moveId,
} from "@/lib/review/payload";
import type { ReviewBookPayload } from "@/lib/review/types";

const book = {
  slug: "ottoline-garden",
  title: "Garden",
  version: 1,
  trim: { in: [8.5, 11], page_count: 2 },
  cover: {
    id: "cover",
    width: 5219,
    height: 3375,
    templatePath: "books/ottoline-garden/cover/cover.template.html",
    preparedHtml: "<html></html>",
    fields: { title: "Garden", print: false },
    previewUrl: null,
    foldsX: [2588, 2631],
    parts: ["front", "spine", "back"],
    previewWrapUrl: null,
    previewFrontUrl: null,
  },
  frontMatter: [
    {
      id: "title",
      width: 2588,
      height: 3375,
      templatePath: "books/ottoline-garden/matter/title.template.html",
      preparedHtml: "<html></html>",
      fields: { title__title: "Garden" },
      previewUrl: null,
    },
  ],
  pages: [
    {
      id: "p01",
      number: 1,
      colorUrl: "https://signed/p01.jpg",
      linePngUrl: "https://signed/p01.png",
      lineSvgUrl: "https://signed/p01.svg",
    },
    {
      id: "p02",
      number: 2,
      colorUrl: null,
      linePngUrl: null,
      lineSvgUrl: null,
    },
  ],
  backMatter: [],
  signedUrls: {},
} satisfies ReviewBookPayload;

describe("review payload", () => {
  it("seeds a draft from the manifest order and fields", () => {
    const draft = createDraftFromBook(book);
    expect(draft.order).toEqual(["p01", "p02"]);
    expect(draft.fields.cover?.title).toBe("Garden");
    expect(draft.fields.title?.title__title).toBe("Garden");
  });

  it("merges a stored draft without dropping new pages", () => {
    const draft = mergeDraft(createDraftFromBook(book), {
      order: ["p02"],
      deleted: ["p01"],
      flags: { p02: { flag: true, note: "check" } },
      inserts: [],
      fields: { cover: { title: "Edited" } },
      uploads: ["books/ottoline-garden/uploads/1-logo.png"],
    });
    expect(draft.order).toEqual(["p02", "p01"]);
    expect(draft.deleted).toEqual(["p01"]);
    expect(draft.fields.cover?.title).toBe("Edited");
  });

  it("moves pages and stamps submitted_at", () => {
    expect(moveId(["p01", "p02"], "p01", 1)).toEqual(["p02", "p01"]);
    const payload = buildSubmissionPayload(createDraftFromBook(book), "stamp");
    expect(payload.submitted_at).toBe("stamp");
    expect(payload.order).toEqual(["p01", "p02"]);
  });
});
