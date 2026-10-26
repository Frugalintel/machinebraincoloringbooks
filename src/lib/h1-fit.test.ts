import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ABOUT_HERO_COPY } from "@/lib/about";
import { HELP_H1 } from "@/lib/help";
import { STORE_COPY } from "@/lib/store";
import { pageH1Em, pageH1Px } from "@/lib/h1-fit";

const root = process.cwd();

function clearsGutter(
  vw: number,
  lines: readonly string[],
  viewport: number,
  gutter: number,
) {
  const em = pageH1Em(lines);
  const size = pageH1Px({ vw, em, viewport, gutter });
  const width = size * em;
  expect(width).toBeLessThanOrEqual(viewport - 2 * gutter + 0.05);
  expect(gutter).toBeGreaterThanOrEqual(20);
  if ((viewport - 2 * gutter) / em >= 32) {
    expect(size).toBeGreaterThanOrEqual(32);
  }
  return size;
}

describe("page H1 fit", () => {
  it("keeps Stories. and Welcome inside the gutter at 360, 390 and 1440", () => {
    for (const viewport of [360, 390, 1440]) {
      const gutter = viewport >= 760 ? 40 : 20;
      const storiesVw = viewport >= 760 ? 11.2 : 26.5;
      clearsGutter(storiesVw, ["Stories."], viewport, gutter);
      const welcomeVw = viewport >= 760 ? 22.3 : 21.5;
      clearsGutter(welcomeVw, ["Welcome", "back."], viewport, gutter);
      const checkVw = viewport >= 760 ? 17.8 : 17;
      clearsGutter(checkVw, ["Check your", "email."], viewport, gutter);
    }
  });

  it("fits the other page H1s at the same widths", () => {
    for (const viewport of [360, 390, 1440]) {
      const gutter = viewport >= 760 ? 40 : 20;
      clearsGutter(
        viewport >= 760 ? 20.83 : 36.63,
        [HELP_H1],
        viewport,
        gutter,
      );
      clearsGutter(
        viewport >= 760 ? 12.28 : 22.33,
        viewport >= 760 ? ABOUT_HERO_COPY.lines : ABOUT_HERO_COPY.mobileLines,
        viewport,
        gutter,
      );
      clearsGutter(
        viewport >= 760 ? 31.07 : 29.52,
        [STORE_COPY.title],
        viewport,
        gutter,
      );
      clearsGutter(viewport >= 760 ? 12 : 18, ["Scan."], viewport, gutter);
    }
  });

  it("does not lock pinch zoom", () => {
    const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/maximumScale/);
  });

  it("declares one shared fit rule", () => {
    const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
    expect(css).toMatch(/\.h1-fit \{[\s\S]*max\(32px, var\(--h1-vw/);
    expect(css).toMatch(
      /100vw - 2 \* var\(--h1-gutter, var\(--m, 20px\)\)\) \/ var\(--h1-em/,
    );
  });

  it("lets .h1-fit beat the home hero size", () => {
    const home = readFileSync(join(root, "src/app/home.css"), "utf8");
    expect(home).toMatch(/\.home-e2 \.h1 \{[\s\S]*font-size:\s*21\.4vw/);
    expect(home).toMatch(/\.home-e2 \.h1 \{[\s\S]*font-size:\s*26\.6vw/);
    expect(home).toMatch(
      /\.home-e2 \.h1\.h1-fit \{[\s\S]*font-size:\s*min\(\s*max\(32px, var\(--h1-vw/,
    );
    const stories = readFileSync(
      join(root, "src/app/stories/paths.css"),
      "utf8",
    );
    expect(stories).toMatch(
      /\.home-e2\.stories-b \.h1\.h1-fit \{[\s\S]*font-size:\s*min\(/,
    );
  });
});
