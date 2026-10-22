import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (/\.(tsx|ts|css)$/.test(name)) out.push(full);
  }
  return out;
}

const SMALL_DISPLAY =
  /font-display[^"'`\n]*text-(xs|sm|base|lg|xl|2xl|3xl)\b|text-(xs|sm|base|lg|xl|2xl|3xl)[^"'`\n]*font-display/;

const OTHER_REDACTION = /Redaction(?:20|35|70|100)\b/;

describe("F2 type guardrail", () => {
  const files = walk(SRC);

  it("never pairs font-display with sub-36px Tailwind sizes", () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, i) => {
        if (SMALL_DISPLAY.test(line)) {
          hits.push(`${file}:${i + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("does not reference other Redaction cuts", () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (OTHER_REDACTION.test(text)) hits.push(file);
    }
    expect(hits).toEqual([]);
  });
});
