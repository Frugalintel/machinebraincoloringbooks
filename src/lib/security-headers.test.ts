import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");

describe("production security headers for /scan", () => {
  it("allows the page camera on this origin", () => {
    expect(config).toMatch(/Permissions-Policy[\s\S]*camera=\(self\)/);
    expect(config).not.toMatch(/camera=\(\)/);
  });

  it("lets the zxing WebAssembly decoder compile", () => {
    expect(config).toMatch(/script-src[^"]*'wasm-unsafe-eval'/);
  });

  it("does not open connect-src to data: URLs", () => {
    expect(config).not.toMatch(/connect-src[^"]*data:/);
  });
});
