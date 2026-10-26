import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  AUTH_CLIENT_TIMEOUT_MS,
  AUTH_COPY,
  AUTH_DEFAULT_NEXT,
  AuthTimeoutError,
  authEntryFromParams,
  authFailure,
  authHeadline,
  authHoldBody,
  authModeCopy,
  codeFromNext,
  safeNextPath,
  validateAuthForm,
  withAuthTimeout,
  type AuthView,
} from "@/lib/auth-ui";

const AUTH_FILES = [
  "src/app/auth/page.tsx",
  "src/app/auth/auth-page-client.tsx",
  "src/components/auth-modal.tsx",
  "src/components/auth-panel.tsx",
  "src/components/use-auth-form.ts",
  "src/lib/auth-ui.ts",
];
const CSS_FILE = "src/components/auth-panel.css";

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf8");
}

const SOURCE = AUTH_FILES.map(read).join("\n");
const CSS = read(CSS_FILE).replace(/\/\*[\s\S]*?\*\//g, "");

/** `selector { body }` rules, media blocks flattened. */
function cssRules(): { selector: string; body: string }[] {
  const flat = CSS.replace(/@media[^{]+\{([\s\S]*?\})\s*\}/g, "$1");
  return [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].trim(),
    body: match[2],
  }));
}

describe("Sign in S3 brand guardrails", () => {
  it("sets Redaction on the giant per-state line only, the page's one H1 (approved S3 off-guide item)", () => {
    const uses = AUTH_FILES.flatMap((file) =>
      (read(file).match(/font-display|--font-redaction/g) ?? []).map(
        () => file,
      ),
    );
    expect(uses).toEqual(["src/components/auth-panel.tsx"]);
    expect(read("src/components/auth-panel.tsx")).toMatch(
      /const Heading = context === "page" \? "h1" : "h2"/,
    );
    const display = cssRules().filter(({ body }) =>
      body.includes("--sa-display)"),
    );
    expect(display.map(({ selector }) => selector)).toEqual([".sa-h1"]);
  });

  it("paints the hold-card edge with a resolved cream so it is not dropped", () => {
    const hold = cssRules().find(
      ({ selector }) => selector === ".sa-hold-card",
    );
    expect(hold?.body).toMatch(
      /border:\s*1px solid rgb\(242 234 216 \/ 0\.16\)/,
    );
    expect(hold?.body).not.toMatch(/var\(--sa-c4\)/);
  });

  it("allows the square cream button and keeps it cream on near-black", () => {
    const button = cssRules().find(({ selector }) => selector === ".sa-btn");
    expect(button?.body).toMatch(/border-radius:\s*0;/);
    expect(button?.body).toMatch(/background:\s*var\(--cream\)/);
    expect(button?.body).toMatch(/color:\s*var\(--ink\)/);
    expect(button?.body).toMatch(/height:\s*64px/);
  });

  it("uses orange only for mono labels, the folio glyph and the 2px focus ring, never as a fill", () => {
    const orange = cssRules()
      .filter(({ body }) => body.includes("--signal"))
      .map(({ selector }) => selector);
    expect(orange).toEqual([".sa-signal", ".sa-sum b,\n.sa-msg b"]);
    for (const { body } of cssRules()) {
      expect(body).not.toMatch(/background[^;]*--signal/);
    }
    expect(CSS).toMatch(/0 0 0 4px var\(--cream\)/);
    expect(CSS).toMatch(/outline:\s*2px solid var\(--cream\)/);
    expect(CSS).not.toMatch(/0 0 0 4px var\(--signal\)/);
    expect(CSS).not.toMatch(/outline:\s*2px solid var\(--signal\)/);
    expect(SOURCE).not.toMatch(
      /bg-(?:primary|signal|brand-orange)|bg-\[#ff4f00\]|border-primary|text-primary|#ff4f00/i,
    );
  });

  it("stays on the four brand colors: no red, status hues or raw hexes", () => {
    expect(SOURCE).not.toMatch(
      /\b(?:text|bg|border)-(?:danger|warning|success|yellow|red|amber|gray|white|black)\b/,
    );
    expect(`${SOURCE}\n${CSS}`).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(CSS).not.toMatch(/--(?:danger|warning|success)|\bred\b/);
    const colors = CSS.match(/var\(--(?:base|cream|ink|paper|signal)\)/g);
    expect(new Set(colors)).toEqual(
      new Set(["var(--base)", "var(--cream)", "var(--ink)", "var(--signal)"]),
    );
  });

  it("uses the official lockup in one ink, cream, and no orange mark", () => {
    const modal = read("src/components/auth-modal.tsx");
    expect(modal).toMatch(
      /<BrandLockup[\s\S]*?ink="cream"[\s\S]*?href=\{null\}/,
    );
    expect(SOURCE).not.toMatch(/ink="ink"|ink="signal"|Machine Brain<\//);
    expect(read("src/app/auth/page.tsx")).not.toMatch(/<BrandLockup|<Mark\b/);
  });

  it("shares one panel between /auth and the modal", () => {
    expect(read("src/app/auth/auth-page-client.tsx")).toMatch(
      /<AuthPanel[\s\S]*?context="page"/,
    );
    expect(read("src/components/auth-modal.tsx")).toMatch(
      /<AuthPanel[\s\S]*?context="modal"/,
    );
  });

  it("drops mocked providers, the reset link, alerts, textures and old faces", () => {
    expect(SOURCE).not.toMatch(
      /Chrome|Facebook|Twitter|Command|signInWithOAuth|handleSocial|Forgot/,
    );
    expect(SOURCE).not.toMatch(/\balert\(/);
    expect(SOURCE).not.toMatch(/Rajdhani|Oswald|font-mono\b/);
    expect(`${SOURCE}\n${CSS}`).not.toMatch(
      /noise|grain|grid-bg|glow|backdrop-blur|animate-pulse|shadow-2xl|text-shadow|filter:/,
    );
    expect(CSS).not.toMatch(/border-radius:\s*[^0\s]/);
  });

  it("writes copy in the brand voice: you, sentence case, no exclamation marks", () => {
    const strings = [
      ...Object.values(AUTH_COPY).flat(),
      ...(["login", "register"] as const).flatMap((mode) =>
        Object.values(authModeCopy(mode)),
      ),
      ...(["login", "register", "check"] as const).flatMap((view) =>
        [false, true].map((code) => authHeadline(view, code).lines.join(" ")),
      ),
    ];
    for (const text of strings) {
      expect(text, text).not.toContain("!");
      expect(text, text).not.toMatch(/\b(?:we|our|us)\b/i);
      expect(text[0], text).toBe(text[0].toUpperCase());
      expect(text.slice(1), text).not.toMatch(/\b[A-Z]{2,}\b/);
    }
  });
});

describe("authHeadline", () => {
  it.each<[AuthView, boolean, string]>([
    ["login", false, "Welcome back."],
    ["register", false, "Keep your pages."],
    ["login", true, "Keep your code."],
    ["register", true, "Keep your code."],
    ["check", false, "Check your email."],
    ["check", true, "Check your email."],
  ])("%s (code: %s) reads %s", (view, hasCode, line) => {
    expect(authHeadline(view, hasCode).lines.join(" ")).toBe(line);
  });

  it("uses the locked /scan hold lines", () => {
    expect(authHeadline("login", "book").lines.join(" ")).toBe(
      "Keep your book.",
    );
    expect(authHeadline("login", "page-plus").lines.join(" ")).toBe(
      "Sign in for your +1.",
    );
    expect(authHoldBody("book")).toBe(
      "Sign in or create an account to add this book and its unlock.",
    );
    expect(authHoldBody("page-plus")).toBe(
      "Sign in or create an account and the point is yours.",
    );
  });
});

describe("validateAuthForm", () => {
  const empty = { email: "", password: "", confirmPassword: "" };

  it("marks every empty field at once", () => {
    expect(validateAuthForm("login", empty)).toEqual({
      email: AUTH_COPY.emailRequired,
      password: AUTH_COPY.passwordRequired,
    });
  });

  it("checks the email shape, then the sign-up minimum and match", () => {
    expect(
      validateAuthForm("register", {
        email: "you@",
        password: "12345",
        confirmPassword: "1234",
      }),
    ).toEqual({
      email: AUTH_COPY.emailInvalid,
      password: AUTH_COPY.passwordTooShort,
      confirmPassword: AUTH_COPY.passwordMismatch,
    });
    expect(
      validateAuthForm("login", {
        email: " you@example.com ",
        password: "1",
        confirmPassword: "",
      }),
    ).toEqual({});
  });
});

describe("authFailure", () => {
  it("maps known Supabase and network errors onto the brand voice", () => {
    expect(authFailure(new Error("Invalid login credentials"))).toEqual({
      summary: AUTH_COPY.invalidLogin,
      fields: { email: "", password: AUTH_COPY.invalidLoginField },
    });
    expect(authFailure(new Error("Email not confirmed")).summary).toBe(
      AUTH_COPY.emailNotConfirmed,
    );
    expect(authFailure(new TypeError("Failed to fetch")).summary).toBe(
      AUTH_COPY.networkError,
    );
    expect(authFailure(new Error("Signups not allowed")).summary).toBe(
      "Signups not allowed",
    );
    expect(authFailure("nope").summary).toBe(AUTH_COPY.genericError);
    expect(authFailure(new AuthTimeoutError()).summary).toBe(
      AUTH_COPY.timedOut,
    );
  });

  it("times out a hung auth request so the form can retry", async () => {
    vi.useFakeTimers();
    const hung = withAuthTimeout(new Promise(() => undefined));
    const rejected = expect(hung).rejects.toBeInstanceOf(AuthTimeoutError);
    await vi.advanceTimersByTimeAsync(AUTH_CLIENT_TIMEOUT_MS);
    await rejected;
    vi.useRealTimers();
  });
});

describe("safeNextPath (open redirect fix)", () => {
  it.each([
    ["/profile/me", "/profile/me"],
    ["/collectibles", "/collectibles"],
    ["/scan?mode=code&code=AB12", "/scan?mode=code&code=AB12"],
    ["/store/1#reviews", "/store/1#reviews"],
    ["/a/../b", "/b"],
    ["/%0a", "/%0a"],
  ])("keeps the on-site path %s", (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "profile",
    "//evil.example",
    "//evil.example/profile",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "/\\/evil.example",
    "https://evil.example",
    "http:/evil.example",
    "javascript:alert(1)",
    "data:text/html,hi",
    " /profile",
    "/\t/evil.example",
    "/\n/evil.example",
  ])("falls back to the profile for %j", (next) => {
    expect(safeNextPath(next)).toBe(AUTH_DEFAULT_NEXT);
  });
});

describe("codeFromNext", () => {
  it("reads a trimmed, upper-case code from an on-site /scan next", () => {
    expect(codeFromNext("/scan?mode=code&code=ab12")).toBe("AB12");
    expect(codeFromNext("/scan?mode=code&code=%20ab12%20")).toBe("AB12");
  });

  it("ignores other paths, other modes and empty codes", () => {
    expect(codeFromNext("/scan?code=ab12")).toBeNull();
    expect(codeFromNext("/scan?mode=code&code=%20")).toBeNull();
    expect(codeFromNext("/scanner?mode=code&code=ab12")).toBeNull();
    expect(codeFromNext("/profile/me")).toBeNull();
  });
});

describe("authEntryFromParams", () => {
  const entry = (query: string) =>
    authEntryFromParams(new URLSearchParams(query));

  it("keeps the live mode and email rules", () => {
    expect(entry("").mode).toBe("login");
    expect(entry("mode=register").mode).toBe("register");
    expect(entry("email=a%40b.co").mode).toBe("register");
    expect(entry("email=a%40b.co&mode=login").mode).toBe("login");
    expect(entry("email=a%40b.co&mode=other").mode).toBe("login");
    expect(entry("email=a%40b.co").email).toBe("a@b.co");
  });

  it("only takes a code from a safe next", () => {
    expect(entry("next=%2Fscan%3Fmode%3Dcode%26code%3Dab12")).toMatchObject({
      next: "/scan?mode=code&code=ab12",
      code: "AB12",
    });
    expect(
      entry("next=%2F%2Fevil.example%2Fscan%3Fmode%3Dcode%26code%3Dab12"),
    ).toMatchObject({ next: AUTH_DEFAULT_NEXT, code: null });
  });
});
