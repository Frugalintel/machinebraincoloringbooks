import { describe, expect, it } from "vitest";
import { NB_HYPHEN, nbHyphen } from "@/lib/nb-hyphen";

describe("nbHyphen", () => {
  it("replaces the hyphen in Quantum-Bulldog", () => {
    expect(nbHyphen("Quantum-Bulldog")).toBe(`Quantum${NB_HYPHEN}Bulldog`);
    expect(nbHyphen("Quantum-Bulldog")).not.toContain("-");
  });
});
