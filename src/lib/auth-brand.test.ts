import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_COPY, authModeCopy } from "@/lib/auth-ui";

const AUTH_FILES = [
  "src/app/auth/page.tsx",
  "src/components/auth-modal.tsx",
  "src/components/auth-panel.tsx",
  "src/lib/auth-ui.ts",
];

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf8");
}

const SOURCE = AUTH_FILES.map(read).join("\n");

describe("Sign in brand guardrails (AUTH-01, AUTH-02, SW-ORANGE-USE-01, SW-LOGO-03)", () => {
  it("sets Redaction once, on the /auth H1 inside the shared panel", () => {
    const uses = AUTH_FILES.flatMap((file) =>
      (read(file).match(/font-display|--font-redaction/g) ?? []).map(
        () => file,
      ),
    );
    expect(uses).toEqual(["src/components/auth-panel.tsx"]);
    expect(read("src/components/auth-panel.tsx")).toMatch(
      /<h1[\s\S]{0,80}font-display/,
    );
  });

  it("keeps signal orange to one small mono label and never fills with it", () => {
    expect(SOURCE).not.toMatch(
      /bg-(?:primary|signal|brand-orange)|bg-\[#ff4f00\]|border-primary|text-primary|#ff4f00/i,
    );
    const signal = SOURCE.match(/[\w:-]*signal\b/g) ?? [];
    expect(signal).toEqual(["text-signal"]);
    expect(read("src/components/auth-panel.tsx")).toMatch(
      /font-label[^"]*text-signal/,
    );
  });

  it("stays on the four brand colors with no status hues or raw hexes", () => {
    expect(SOURCE).not.toMatch(
      /\b(?:text|bg|border)-(?:danger|warning|success|yellow|red|amber|gray|white|black)\b/,
    );
    expect(SOURCE).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("uses the official lockup from the brand component in one ink", () => {
    const panel = read("src/components/auth-panel.tsx");
    expect(panel).toMatch(
      /<BrandLockup[\s\S]*?layout="stacked"[\s\S]*?ink="cream"/,
    );
    expect(panel).not.toMatch(/ink="ink"|Machine Brain<\//);
    expect(read("src/app/auth/page.tsx")).not.toMatch(/<BrandLockup|<Mark\b/);
    expect(read("src/components/auth-modal.tsx")).not.toMatch(
      /<BrandLockup|<Mark\b/,
    );
  });

  it("shares one panel between /auth and the modal", () => {
    expect(read("src/app/auth/page.tsx")).toMatch(
      /<AuthPanel[\s\S]*?context="page"/,
    );
    expect(read("src/components/auth-modal.tsx")).toMatch(
      /<AuthPanel[\s\S]*?context="modal"/,
    );
  });

  it("drops mocked providers, dead links, alerts, textures and old faces", () => {
    expect(SOURCE).not.toMatch(
      /Chrome|Facebook|Twitter|Command|signInWithOAuth|handleSocial|Forgot/,
    );
    expect(SOURCE).not.toMatch(/\balert\(/);
    expect(SOURCE).not.toMatch(/Rajdhani|Oswald|font-mono\b/);
    expect(SOURCE).not.toMatch(
      /noise|grain|grid-bg|glow|backdrop-blur|animate-pulse|shadow-2xl/,
    );
    expect(SOURCE).not.toMatch(/h-2 w-full|header strip/i);
  });

  it("writes copy in the brand voice: you, sentence case, no exclamation marks", () => {
    const strings = [
      ...Object.values(AUTH_COPY),
      ...(["login", "register"] as const).flatMap((mode) =>
        Object.values(authModeCopy(mode)),
      ),
    ];
    for (const text of strings) {
      expect(text, text).not.toContain("!");
      expect(text, text).not.toMatch(/\b(?:we|our|us)\b/i);
      expect(text[0], text).toBe(text[0].toUpperCase());
      expect(text.slice(1), text).not.toMatch(/\b[A-Z]{2,}\b/);
    }
    for (const mode of ["login", "register"] as const) {
      const { title, label } = authModeCopy(mode);
      expect(title.slice(1)).toBe(title.slice(1).toLowerCase());
      expect(label.slice(1)).toBe(label.slice(1).toLowerCase());
    }
  });
});
