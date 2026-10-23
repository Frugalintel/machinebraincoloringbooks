import { describe, expect, it } from "vitest";
import { isAllCapsDisplay, toSentenceCase } from "@/lib/display-text";

describe("toSentenceCase", () => {
  it("renders all-caps catalog titles in sentence case without mutating mixed case", () => {
    expect(toSentenceCase("VINTAGE")).toBe("Vintage");
    expect(toSentenceCase("SCI-FI")).toBe("Sci-fi");
    expect(toSentenceCase("ALL BOOKS")).toBe("All books");
    expect(toSentenceCase("Machine Brain")).toBe("Machine Brain");
    expect(toSentenceCase("Night Terror")).toBe("Night Terror");
    expect(toSentenceCase("")).toBe("");
    expect(toSentenceCase("   ")).toBe("   ");
  });

  it("preserves surrounding whitespace on converted titles", () => {
    expect(toSentenceCase("  HORROR  ")).toBe("  Horror  ");
  });

  it("detects all-caps display strings", () => {
    expect(isAllCapsDisplay("VINTAGE")).toBe(true);
    expect(isAllCapsDisplay("Sci-Fi")).toBe(false);
    expect(isAllCapsDisplay("123")).toBe(false);
  });
});
