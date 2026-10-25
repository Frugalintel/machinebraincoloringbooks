import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  HELP_ART,
  HELP_CONTACT_LEAD,
  HELP_FAQ,
  HELP_HOW_LINES,
  HELP_PLACEHOLDERS,
  HELP_REGISTER_BODY,
  HELP_SIGN_IN_HREF,
  HELP_STEPS,
} from "@/lib/help";
import { HOME_CODES_COPY, HOME_ENTER_COPY } from "@/lib/home";

const SRC = join(process.cwd(), "src");

function spoken(value: string): string {
  return value.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("Help copy lock", () => {
  it("reuses the home how-it-works line and the register sentence", () => {
    expect(HELP_HOW_LINES).toEqual(HOME_CODES_COPY.lines);
    expect(
      HELP_REGISTER_BODY.startsWith("Scan the QR on the back cover once."),
    ).toBe(true);
    expect(HELP_REGISTER_BODY).toContain(HOME_ENTER_COPY.register.slice(0, -1));
    expect(HELP_STEPS[0]?.body).toBe(HELP_REGISTER_BODY);
    expect(HELP_STEPS[1]?.body).toContain(
      "Every page has a code, printed at the foot beside the plate number",
    );
    expect(HELP_STEPS[2]?.body).toContain("Two points a page at most");
    expect(HELP_STEPS[3]?.body).not.toMatch(/Legendary/);
    expect(HELP_ART.pageLine.src).toBe("/help/page-half.webp");
  });

  it("uses curly apostrophes in spoken copy", () => {
    const spokenCopy = [
      HELP_CONTACT_LEAD,
      ...HELP_STEPS.map((step) => step.body),
      ...HELP_FAQ.flatMap((group) =>
        group.questions.flatMap((question) => [
          question.question,
          ...question.answer.flatMap((paragraph) =>
            paragraph
              .filter((part) => part.type === "text")
              .map((part) => part.text),
          ),
        ]),
      ),
    ].join("\n");
    expect(spokenCopy).not.toMatch(/[A-Za-z]'[A-Za-z]/);
    expect(spokenCopy).toMatch(/\u2019/);
  });

  it("keeps every open item marked Placeholder ·", () => {
    expect(HELP_PLACEHOLDERS).toHaveLength(8);
    for (const placeholder of HELP_PLACEHOLDERS) {
      expect(placeholder.startsWith("Placeholder ·")).toBe(true);
    }
    const blob = HELP_FAQ.flatMap((group) =>
      group.questions.flatMap((question) =>
        question.answer.flatMap((paragraph) =>
          paragraph.filter((part) => part.type === "placeholder"),
        ),
      ),
    );
    expect(blob).toHaveLength(7);
    expect(HELP_SIGN_IN_HREF).toBe("/auth?mode=login&next=/help");
  });

  it("does not speak as we in help source", () => {
    const files = [
      "lib/help.ts",
      "app/help/page.tsx",
      "app/help/layout.tsx",
      "app/help/help-faq.tsx",
    ];
    for (const file of files) {
      const text = spoken(readFileSync(join(SRC, file), "utf8"));
      expect(text, file).not.toMatch(/\b[Ww]e\b/);
      expect(text, file).not.toContain("support@machinebrain.com");
    }
  });
});
