import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "@/lib/review/submit";

describe("review submission conflicts", () => {
  it("detects Postgres unique_violation 23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(
      isUniqueViolation({ message: "duplicate" } as { code?: string }),
    ).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
