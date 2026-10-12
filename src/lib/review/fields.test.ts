import { describe, expect, it } from "vitest";
import { fieldControlFor, fieldLabel } from "@/lib/review/fields";

describe("review fields", () => {
  it("maps value types to controls", () => {
    expect(fieldControlFor("print", false)).toBe("checkbox");
    expect(fieldControlFor("logo_src", "")).toBe("image");
    expect(fieldControlFor("tile_1_src", "assets/tile-p05.svg")).toBe("image");
    expect(fieldControlFor("title", "Grandma Ottoline's\nImpossible Garden")).toBe(
      "textarea",
    );
    expect(fieldControlFor("tagline", "TAGLINE")).toBe("text");
  });

  it("humanizes keys", () => {
    expect(fieldLabel("title__spot_art_src")).toBe("title / spot art src");
  });
});
