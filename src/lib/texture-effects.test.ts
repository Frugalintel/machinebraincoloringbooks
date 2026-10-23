import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const PUBLIC = join(ROOT, "public");

const BANNED = [
  "/textures/noise.svg",
  "crt-scanline",
  "crt-overlay",
  "glitch-text",
  "text-orange-glow",
  "pulse-glow",
  "site-banner-glitch",
  "animate-glitch",
  "grid-bg-move",
  "text-flicker",
  "feTurbulence",
  "noiseFilter",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (/\.(tsx|ts|css|svg)$/.test(name)) out.push(full);
  }
  return out;
}

describe("F6 texture and effects guardrail", () => {
  it("does not keep the grain tile asset", () => {
    expect(existsSync(join(PUBLIC, "textures", "noise.svg"))).toBe(false);
  });

  it("does not reintroduce noise, scanline, glitch, or glow utilities", () => {
    const files = [...walk(SRC), ...(existsSync(PUBLIC) ? walk(PUBLIC) : [])];
    const hits: string[] = [];

    for (const file of files) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, index) => {
        for (const token of BANNED) {
          if (line.includes(token)) {
            hits.push(`${file}:${index + 1}:${token}:${line.trim()}`);
          }
        }
      });
    }

    expect(hits).toEqual([]);
  });
});
