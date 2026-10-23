import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SYSTEM_STATE_ACTIONS,
  SYSTEM_STATE_MARK_SIZE_PX,
  systemStateCopy,
} from "@/lib/system-state";

const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

describe("system state copy", () => {
  it("keeps Home, Store, and Sign in as next actions", () => {
    expect(SYSTEM_STATE_ACTIONS.map((action) => action.href)).toEqual([
      "/",
      "/store",
      "/auth?mode=login",
    ]);
  });

  it("uses a full mark size and quiet titles", () => {
    expect(SYSTEM_STATE_MARK_SIZE_PX).toBeGreaterThanOrEqual(48);
    expect(systemStateCopy("notFound").title).toBe("Page not found");
    expect(systemStateCopy("error").title).toBe("Something went wrong");
    expect(systemStateCopy("notFound").code.toLowerCase()).toContain("404");
  });
});

describe("F7 system-state wiring", () => {
  const files = walk(SRC);

  it("adds branded not-found, error, global-error, and loading files", () => {
    const required = [
      "app/not-found.tsx",
      "app/error.tsx",
      "app/global-error.tsx",
      "app/loading.tsx",
      "app/store/loading.tsx",
      "app/store/[id]/loading.tsx",
      "app/collectibles/loading.tsx",
      "app/collectibles/[id]/loading.tsx",
      "app/auth/loading.tsx",
    ];

    for (const relative of required) {
      expect(files.some((file) => file.endsWith(relative))).toBe(true);
    }
  });

  it("calls notFound() from missing product, collectible, and story routes", () => {
    const product = readFileSync(join(SRC, "app/store/[id]/page.tsx"), "utf8");
    const collectible = readFileSync(
      join(SRC, "app/collectibles/[id]/page.tsx"),
      "utf8",
    );
    const story = readFileSync(join(SRC, "app/stories/[id]/page.tsx"), "utf8");
    const collectibleClient = readFileSync(
      join(SRC, "app/collectibles/[id]/collectible-client.tsx"),
      "utf8",
    );

    expect(product).toMatch(/if\s*\(!product\)\s*\{\s*notFound\(\)/);
    expect(collectible).toMatch(/if\s*\(!found\)\s*\{\s*notFound\(\)/);
    expect(story).toMatch(/if\s*\(!story\)\s*\{\s*notFound\(\)/);
    expect(collectibleClient).not.toMatch(/ARTIFACT NOT FOUND IN ARCHIVES/);
    expect(story).not.toMatch(/STORY FILE NOT FOUND/);
  });

  it("keeps global-error self-contained with tokens and fonts", () => {
    const text = readFileSync(join(SRC, "app/global-error.tsx"), "utf8");
    expect(text).toMatch(/<html/);
    expect(text).toMatch(/<body/);
    expect(text).toMatch(/displayFont\.variable/);
    expect(text).toMatch(/sansFont\.variable/);
    expect(text).toMatch(/monoFont\.variable/);
    expect(text).toMatch(/globals\.css/);
    expect(text).toMatch(/standalone/);
  });

  it("does not put orange fills on system-state pages", () => {
    const systemFiles = files.filter((file) =>
      /system-state|system-loading|not-found|global-error|\/error\.tsx|\/loading\.tsx/.test(
        file,
      ),
    );
    const hits: string[] = [];
    const orangeFill =
      /(?:^|[\s"'`:(])(?:(?:hover|focus|active):)*bg-(?:primary|signal|brand-orange)/;

    for (const file of systemFiles) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          if (orangeFill.test(line)) {
            hits.push(`${file}:${index + 1}:${line.trim()}`);
          }
        });
    }

    expect(hits).toEqual([]);
  });
});
