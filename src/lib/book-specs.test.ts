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
        page_count: null,
        trim_width_in: 0,
        trim_height_in: "abc",
        paper: "  ",
        binding: null,
        title_lines: "",
      }),
    ).toEqual({});
  });

  it("keeps real values, parsing numeric columns PostgREST returns as strings", () => {
    expect(
      readBookSpecs({
        page_count: "48",
        trim_width_in: "8.5",
        trim_height_in: 11,
        paper: " 100 lb uncoated ",
        binding: "Perfect bound",
        title_lines: "Realm\nWalker",
      }),
    ).toEqual({
      page_count: 48,
      trim_width_in: 8.5,
      trim_height_in: 11,
      paper: "100 lb uncoated",
      binding: "Perfect bound",
      title_lines: "Realm\nWalker",
    });
  });
});

describe("coverAspect", () => {
  it("follows the trim when both sides are known", () => {
    expect(coverAspect({ trim_width_in: 8.5, trim_height_in: 11 })).toBe(
      8.5 / 11,
    );
  });

  it("falls back to the default cover aspect when the trim is incomplete", () => {
    expect(coverAspect({})).toBe(DEFAULT_COVER_ASPECT);
    expect(coverAspect({ trim_width_in: 8.5 })).toBe(DEFAULT_COVER_ASPECT);
  });
});
