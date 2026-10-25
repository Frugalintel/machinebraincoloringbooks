import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LockedFigure } from "./locked-figure";

describe("LockedFigure", () => {
  it("draws the cream line placeholder when the item has no art", () => {
    const { container } = render(
      <LockedFigure item={{ name: "Rover-X" }} className="ob gh" />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("uses a future still in the same slot", () => {
    const { container } = render(
      <LockedFigure
        item={{ name: "Hound", art: "/collectibles/hound.webp" }}
        className="ob gh"
      />,
    );
    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toContain("hound.webp");
    expect(image).toHaveClass("ob", "gh");
  });
});
