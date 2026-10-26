import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NB_HYPHEN, nbHyphen } from "@/lib/nb-hyphen";

describe("nbHyphen", () => {
  it("replaces the hyphen in Quantum-Bulldog", () => {
    expect(nbHyphen("Quantum-Bulldog")).toBe(`Quantum${NB_HYPHEN}Bulldog`);
    expect(nbHyphen("Quantum-Bulldog")).not.toContain("-");
  });

  it("keeps the ASCII hyphen on collectible tiles so the name can wrap", () => {
    const root = process.cwd();
    const tile = readFileSync(
      join(root, "src/components/collectibles/set-case.tsx"),
      "utf8",
    );
    expect(tile).not.toContain("nbHyphen");
    expect(tile).toContain("{bay.name}");
    const css = readFileSync(
      join(root, "src/app/collectibles/vitrine.css"),
      "utf8",
    );
    expect(css).toMatch(/\.nm \{[\s\S]*?overflow-wrap:\s*break-word/);
    expect(css).toMatch(/\.bays \{[\s\S]*?margin:\s*56px 20px 0/);
    expect(css).toMatch(/margin:\s*36px 20px 0/);
  });
});
