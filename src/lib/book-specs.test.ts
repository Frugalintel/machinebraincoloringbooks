import { describe, expect, it } from "vitest";
import {
  DEFAULT_COVER_ASPECT,
  coverAspect,
  readBookSpecs,
} from "@/lib/book-specs";

describe("readBookSpecs", () => {
  it("reads nothing from a row written before the spec migration", () => {
    expect(readBookSpecs({})).toEqual({});
  });

  it("drops nulls, blanks and non-positive numbers instead of inventing values", () => {
    expect(
      readBookSpecs({
        pages: null,
        sides: "  ",
        trim: "",
        binding: null,
        detail: 0,
        lines: "",
      }),
    ).toEqual({});
  });

  it("keeps real values, parsing numeric columns PostgREST returns as strings", () => {
    expect(
      readBookSpecs({
        pages: "48",
        sides: " single ",
        trim: " 8.5 × 11 in ",
        binding: "Paperback",
        detail: "3",
        lines: "Realm\nWalker",
      }),
    ).toEqual({
      pages: 48,
      sides: "single",
      trim: "8.5 × 11 in",
      binding: "Paperback",
      detail: 3,
      lines: "Realm\nWalker",
    });
  });
});

describe("coverAspect", () => {
  it("follows the trim string", () => {
    expect(coverAspect({ trim: "8.5 × 11 in" })).toBe(8.5 / 11);
    expect(coverAspect({ trim: "8 × 10 in" })).toBe(8 / 10);
    expect(coverAspect({ trim: "8 x 10" })).toBe(8 / 10);
  });

  it("falls back to the default cover aspect when the trim is missing", () => {
    expect(coverAspect({})).toBe(DEFAULT_COVER_ASPECT);
    expect(coverAspect({ trim: "square" })).toBe(DEFAULT_COVER_ASPECT);
  });
});
