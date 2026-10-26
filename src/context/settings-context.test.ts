import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/context/settings-context.tsx"),
  "utf8",
);

describe("settings lookups that may have no row", () => {
  it("uses maybeSingle for campaigns and system_settings", () => {
    expect(source).toMatch(/from\("campaigns"\)[\s\S]*maybeSingle\(\)/);
    expect(source).toMatch(/from\("system_settings"\)[\s\S]*maybeSingle\(\)/);
    expect(source).not.toMatch(/(?<!maybe)\.single\(\)/);
  });
});
