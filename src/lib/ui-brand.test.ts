import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CREAM_ON_CREAM,
  ORANGE_FILL_CLASS,
  SMALL_MONO_CHIP,
  TITLE_UPPERCASE,
  isOrangeFillAllowlisted,
} from "@/lib/ui-brand";

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

describe("F5 UI brand guardrail", () => {
  const files = walk(SRC);

  it("does not use signal orange as a background fill outside the allowlist", () => {
    const hits: string[] = [];
    for (const file of files) {
      if (isOrangeFillAllowlisted(file)) continue;
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, index) => {
        if (ORANGE_FILL_CLASS.test(line)) {
          hits.push(`${file}:${index + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("keeps --primary mapped away from large orange button fills", () => {
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8");
    const button = readFileSync(join(SRC, "components/ui/button.tsx"), "utf8");
    expect(button).toMatch(/variant:\s*\{[\s\S]*primary:|default:\s*"bg-cream/);
    expect(button).not.toMatch(
      /default:\s*"bg-primary|primary:\s*"bg-primary|default:\s*"bg-signal/,
    );
    expect(css).toMatch(
      /--primary:\s*var\(--signal\)|--primary:\s*var\(--cream\)/,
    );
  });

  it("does not set IBM Plex Mono chips or labels below 11px", () => {
    const hits: string[] = [];
    for (const file of files) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      if (file.endsWith("ui-brand.ts")) continue;
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, index) => {
        if (SMALL_MONO_CHIP.test(line)) {
          hits.push(`${file}:${index + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("does not force uppercase on heading or display titles", () => {
    const hits: string[] = [];
    for (const file of files) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      if (file.endsWith("ui-brand.ts") || file.endsWith("globals.css"))
        continue;
      if (file.endsWith("mark.tsx")) continue;
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, index) => {
        if (TITLE_UPPERCASE.test(line)) {
          hits.push(`${file}:${index + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("keeps the component gallery noindex and out of customer nav", () => {
    const page = readFileSync(join(SRC, "app/dev/components/page.tsx"), "utf8");
    const robots = readFileSync(join(SRC, "app/robots.ts"), "utf8");
    const shell = readFileSync(join(SRC, "lib/site-shell.ts"), "utf8");
    expect(page).toMatch(/index:\s*false/);
    expect(robots).toMatch(/\/dev\//);
    expect(shell).not.toMatch(/\/dev\/components/);
  });

  it("does not pair solid cream fills with cream type", () => {
    const hits: string[] = [];
    for (const file of files) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      if (file.endsWith("ui-brand.ts")) continue;
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, index) => {
        const cleaned = line
          .replace(/selection:(?:bg-cream|text-cream)/g, "")
          .replace(/(?:hover|group-hover|focus|focus-visible):text-cream/g, "");
        if (CREAM_ON_CREAM.test(cleaned)) {
          hits.push(`${file}:${index + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("defines one spacing scale, one radius, dual-surface focus, and reduced motion", () => {
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8");
    expect(css).toMatch(/--space-1:\s*0\.25rem|--space-1:\s*4px/);
    expect(css).toMatch(/--radius:\s*0rem/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(/\.focus-ring\b/);
    expect(css).toMatch(/\.focus-ring-on-cream\b/);
  });
});
