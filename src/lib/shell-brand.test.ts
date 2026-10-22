import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SHELL_FILES = [
  "src/components/navbar.tsx",
  "src/components/footer.tsx",
  "src/components/mobile-nav.tsx",
  "src/components/site-header.tsx",
  "src/lib/site-shell.ts",
];

const ORANGE_FILL =
  /(?:^|[\s"'`])(?:(?:hover|focus|active|focus-visible):)*bg-(?:primary|signal|brand-orange)\b|bg-\[#(?:ff4f00|FF4F00)\]/i;

const ORANGE_MARK =
  /text-primary[^"'`\n]*(?:Brain|wordmark)|(?:Brain|wordmark)[^"'`\n]*text-primary|bg-primary[^"'`\n]*(?:w-|h-)(?:2|3|4|8|10|12)\b|w-(?:2|3|4|8)\s[^"'`\n]*h-(?:2|3|4|8)[^"'`\n]*bg-primary/i;

const REDACTION = /font-display\b|Redaction|font-redaction|--font-redaction/;

function existingShellFiles(): string[] {
  return SHELL_FILES.filter((relative) => {
    try {
      return statSync(join(ROOT, relative)).isFile();
    } catch {
      return false;
    }
  });
}

describe("F4 shell brand guardrail", () => {
  const files = existingShellFiles();

  it("does not use signal orange as a fill in shell components", () => {
    const hits: string[] = [];
    for (const relative of files) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      text.split("\n").forEach((line, index) => {
        if (ORANGE_FILL.test(line)) {
          hits.push(`${relative}:${index + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("does not treat the mark or wordmark as orange identity", () => {
    const hits: string[] = [];
    for (const relative of files) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      text.split("\n").forEach((line, index) => {
        if (ORANGE_MARK.test(line)) {
          hits.push(`${relative}:${index + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("does not use Redaction anywhere in the shell", () => {
    const hits: string[] = [];
    for (const relative of files) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      if (REDACTION.test(text)) {
        hits.push(relative);
      }
    }
    expect(hits).toEqual([]);
  });

  it("keeps every public brand mark ink cream or ink", () => {
    const brand = join(ROOT, "public/brand");
    const names = readdirSync(brand);
    expect(names.some((name) => /orange|signal/i.test(name))).toBe(false);
  });
});
